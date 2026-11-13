#!/usr/bin/env python3
"""Render the doodle-in-box + yellow/white caption overlay as a transparent .mov.

usage:
  build_overlay.py CONFIG.json test OUTDIR t1 t2 ...      -> PNG test frames
  build_overlay.py CONFIG.json full OUT.mov [workers=4]   -> full overlay (parallel)
"""
import sys, os, json, subprocess, numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
CFG = json.load(open(sys.argv[1]))
CDIR = os.path.dirname(os.path.abspath(sys.argv[1]))
def P(p): return p if os.path.isabs(p) else os.path.join(CDIR, p)

W, H, FPS = 1080, 1920, 30
DUR = CFG['duration']
RW, CROPH = 576, 440
SCALE = CFG.get('doodle_scale', 1.25)
DW, DH = int(RW * SCALE), int(CROPH * SCALE)
CAP_Y = CFG.get('cap_y', 1400)
YEL = (255, 214, 0)
FONT = os.path.join(ASSETS, 'LuckiestGuy.ttf')
STK = 12

# ---------- doodles ----------
def key_alpha(f):
    f = f.astype(np.int16)
    a = np.clip((80 - (f[..., 2] - f[..., 0])) / 50.0, 0, 1) * np.clip((200 - f.mean(-1)) / 60.0, 0, 1)
    a[:10] = 0; a[:, :10] = 0; a[:, -10:] = 0
    return a

DOODLES = CFG['doodles']
frames = {}  # (doodle idx) -> list of alpha arrays (uint8 576x440)
for i, d in enumerate(DOODLES):
    if 'png' in d:
        path = d['png'] if os.path.exists(P(d['png'])) else os.path.join(ASSETS, 'doodles', d['png'])
        im = Image.open(P(path) if os.path.exists(P(path)) else path).convert('RGBA')
        frames[i] = [np.asarray(im.resize((RW, CROPH)))[..., 3]]
    else:  # animated, keyed from a sky-background reference video
        cb = d.get('crop_bottom', 440)
        b = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(d['r0']), '-t', str(d['r1'] - d['r0']), '-i', P(d['ref']),
                            '-vf', f'fps={FPS},scale={RW}:-2,crop={RW}:{CROPH}:0:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                           capture_output=True).stdout
        n = len(b) // (RW * CROPH * 3); lst = []
        for k in range(n):
            a = key_alpha(np.frombuffer(b, np.uint8, RW * CROPH * 3, k * RW * CROPH * 3).reshape(CROPH, RW, 3))
            a[cb:] = 0; lst.append((a * 255).astype(np.uint8))
        frames[i] = lst

PADX, PADY = 30, 26
BW, BH = DW + 2 * PADX, DH + 2 * PADY
BX, BY = (W - BW) // 2, CFG.get('box_y', 50)
def make_box():
    sh = 30
    im = Image.new('RGBA', (BW + 2 * sh, BH + 2 * sh), (0, 0, 0, 0))
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((sh, sh + 10, sh + BW, sh + BH + 10), 44, fill=150)
    im.putalpha(m.filter(ImageFilter.GaussianBlur(14)))
    ImageDraw.Draw(im).rounded_rectangle((sh, sh, sh + BW, sh + BH), 44, fill=(255, 255, 255, 245), outline=YEL + (255,), width=9)
    return im, sh
BOX, SH = make_box()
_cache = {}
def doodle_img(i, k):
    if (i, k) in _cache: return _cache[(i, k)]
    a = Image.fromarray(frames[i][k]).resize((DW, DH), Image.LANCZOS).filter(ImageFilter.MaxFilter(3))
    la = np.asarray(a); z = np.full_like(la, 15)
    im = Image.fromarray(np.dstack([z, z, z, la]))
    if len(_cache) > 200: _cache.clear()
    _cache[(i, k)] = im
    return im

# ---------- captions ----------
words = json.load(open(P(CFG['words'])))
fix = CFG.get('word_fix', {})
ws = []
for w in words:
    t = fix.get(w['w'], w['w'])
    if t.startswith('-') and ws:
        ws[-1]['w'] += t; ws[-1]['e'] = w['e']; continue
    ws.append(dict(w=t, s=w['s'], e=w['e']))
if 'lead_words' in CFG:  # words whisper missed at the start: spread by length
    lw = CFG['lead_words']; toks = lw['text'].split()
    tot = sum(len(x) + 1 for x in toks); t = lw['t0']; lead = []
    for x in toks:
        d = (len(x) + 1) / tot * (lw['t1'] - lw['t0'])
        lead.append(dict(w=x, s=t, e=t + d)); t += d
    ws = lead + ws
chunks, cur = [], []
for w in ws:
    cur.append(w)
    if len(cur) == 2 or w['w'][-1] in '.,!?' or len(w['w'].strip('.,!?')) >= 10:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
caps = []
for i, c in enumerate(chunks):
    nxt = chunks[i + 1][0]['s'] if i + 1 < len(chunks) else DUR
    caps.append((c[0]['s'], min(nxt, c[-1]['e'] + 0.45), [(x['w'].strip('.,!?').upper(), x['s']) for x in c]))

def fit(txt):
    size = CFG.get('cap_size', 128)
    while True:
        f = ImageFont.truetype(FONT, size)
        bb = f.getbbox(txt, stroke_width=STK)
        if bb[2] - bb[0] < W - 80 or size < 60: return f
        size -= 4
_cc = {}
def cap_img(wl, active):
    key = (tuple(wl), active)
    if key in _cc: return _cc[key]
    txt = ' '.join(wl); f = fit(txt); bb = f.getbbox(txt, stroke_width=STK)
    im = Image.new('RGBA', (bb[2] - bb[0] + 30, bb[3] - bb[1] + 30), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im); x = 15 - bb[0]; sp = f.getlength(' ')
    for i, w in enumerate(wl):
        dr.text((x, 15 - bb[1]), w, font=f, fill=YEL if i == active else (255, 255, 255), stroke_width=STK, stroke_fill='black')
        x += f.getlength(w) + sp
    _cc[key] = im
    return im

def frame(t):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for i, d in enumerate(DOODLES):
        o0, o1 = d['t0'], d['t1']
        if o0 <= t < o1:
            n = len(frames[i]); L = n - 1
            if L > 0:
                u = int((t - o0) * FPS) % (2 * L); k = u if u < L else 2 * L - u
            else: k = 0
            panel = BOX.copy(); panel.alpha_composite(doodle_img(i, k), (SH + PADX, SH + PADY))
            p = min(1, (t - o0) / 0.18); sc = 0.9 + 0.1 * (1 - (1 - p) ** 3)
            fade = min(1, (o1 - t) / 0.15) if o1 < DUR - 0.01 else 1
            if sc < 1: panel = panel.resize((int(panel.width * sc), int(panel.height * sc)), Image.BILINEAR)
            al = min(p * 1.5, 1) * fade
            if al < 1:
                arr = np.array(panel); arr[..., 3] = (arr[..., 3] * al).astype(np.uint8); panel = Image.fromarray(arr)
            img.alpha_composite(panel, (BX + BW // 2 - panel.width // 2, BY + BH // 2 - panel.height // 2))
    for (s, e, wl) in caps:
        if s <= t < e:
            started = [i for i, (_, ws_) in enumerate(wl) if ws_ <= t + 0.03]
            ci = cap_img([w for w, _ in wl], started[-1] if started else 0)
            sc = 0.85 + 0.15 * min(1, (t - s) / 0.08)
            c2 = ci.resize((int(ci.width * sc), int(ci.height * sc)), Image.LANCZOS) if sc < 1 else ci
            img.alpha_composite(c2, ((W - c2.width) // 2, CAP_Y - c2.height // 2))
    return img

def render_part(args):
    part, parts, out = args
    n = int(round(DUR * FPS)); a = n * part // parts; b = n * (part + 1) // parts
    fn = f'{out}.part{part}.mov'
    pr = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'qtrle', fn], stdin=subprocess.PIPE)
    for i in range(a, b): pr.stdin.write(frame(i / FPS).tobytes())
    pr.stdin.close(); pr.wait(); return fn

if __name__ == '__main__':
    mode = sys.argv[2]
    if mode == 'test':
        out = sys.argv[3]; os.makedirs(out, exist_ok=True)
        for t in map(float, sys.argv[4:]): frame(t).save(f'{out}/test_{t:05.2f}.png')
    else:
        out = sys.argv[3]; parts = int(sys.argv[4]) if len(sys.argv) > 4 else 4
        with Pool(parts) as pool: files = pool.map(render_part, [(p, parts, out) for p in range(parts)])
        lst = out + '.txt'
        open(lst, 'w').write(''.join(f"file '{os.path.abspath(f)}'\n" for f in files))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
        for f in files: os.remove(f)
        os.remove(lst)
        print('overlay ->', out)
