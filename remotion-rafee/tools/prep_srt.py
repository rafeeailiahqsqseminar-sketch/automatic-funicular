"""Usage: python3 -I prep_srt.py SUBS.srt OUT.json DURATION "a-b,c-d,..." ["salah=>betul;..."] [audio.f32]
audio.f32 (optional): raw mono float32 16 kHz of the ORIGINAL audio
(ffmpeg -i SRC -ac 1 -ar 16000 -f f32le a.f32). With it, words are spread over voiced time only.
Removes the cut intervals (old seconds) from the timeline and writes word-level caption timing
(split evenly by word length inside each SRT cue) plus the cut points, on the NEW timeline."""
import json, re, sys
import numpy as np
srt, out, dur, cuts = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
fix = [p.split('=>') for p in sys.argv[5].split(';')] if len(sys.argv) > 5 and sys.argv[5] else []
aud = sys.argv[6] if len(sys.argv) > 6 else ''
voiced = None
if aud:
    x = np.fromfile(aud, dtype='<f4'); hop = 160  # 10 ms
    r = np.sqrt(np.convolve(x**2, np.ones(400)/400, 'same')[::hop])
    db = 20*np.log10(r + 1e-9); voiced = db > max(-45, np.percentile(db, 60) - 18)
cuts = sorted([tuple(map(float, c.split('-'))) for c in cuts.split(',') if c])
def m(t):  # old -> new time
    s = 0.0
    for a, b in cuts:
        if t >= b: s += b - a
        elif t > a: return a - s
    return t - s
def ts(x):
    h, mi, rest = x.split(':'); se, ms = rest.split(','); return int(h)*3600 + int(mi)*60 + int(se) + int(ms)/1000
text = open(srt, encoding='utf-8-sig').read().replace('\r', '')
words = []
for blk in re.split(r'\n\s*\n', text.strip()):
    L = blk.split('\n')
    if len(L) < 3: continue
    a, b = [ts(x.strip()) for x in L[1].split('-->')]
    t = ' '.join(L[2:])
    for x, y in fix: t = t.replace(x, y)
    ws = t.split()
    wt = [len(w) + 2 for w in ws]; tot = sum(wt)
    if voiced is not None:
        fr = np.arange(int(a*100), int(b*100)); v = voiced[fr[fr < len(voiced)]]
        if v.sum() < 5: v = np.ones_like(v)
        cum = np.cumsum(v) / v.sum()  # voiced share up to each 10 ms frame
        k = 0.0
        for w, q in zip(ws, wt):
            i0 = int(np.searchsorted(cum, k, 'right')); k += q / tot; i1 = int(np.searchsorted(cum, k - 1e-9))
            s0 = a + i0/100; e0 = a + max(i1, i0 + 1)/100
            words.append({'w': w, 's': round(m(s0), 3), 'e': round(m(e0), 3)})
        continue
    acc = a
    for w, q in zip(ws, wt):
        d = (b - a) * q / tot
        words.append({'w': w, 's': round(m(acc), 3), 'e': round(m(acc + d), 3)}); acc += d
newdur = round(m(dur), 3)
json.dump({'duration': newdur, 'cuts': [round(m(a), 3) for a, b in cuts], 'words': words}, open(out, 'w'), ensure_ascii=False, indent=0)
print('new duration', newdur)
for w in words: print(f"{w['s']:7.2f} {w['w']}")
