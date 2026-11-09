"""Usage: python3 -I tools/face_bubble.py VIDEO.mp4 MUKA.mov OUT.mp4 "ayat,p1,end" [opsyen]
Letak muka Rafee Ailiah (video dummy, suara asal dibuang) dalam bulatan emas di atas video siri
Tubuh & Tanda / Ayat, dengan tag RAFEE AILIAH dan tagline "Sahabat Hati & Fikiran Anda".
Bulatan berpindah ikut babak: pembuka (tengah atas) -> kad (kanan atas kad) -> isi (POS) -> end card.
  ayat,p1,end  = masa (s) kad bermula, kad isi pertama, end card (sama dengan timing dalam ayat.ts)
Opsyen:
  --pos X,Y       kedudukan kanvas bulatan semasa babak isi (default -32,770 = kiri rajah badan atas;
                  bahagian 2 guna 0,260; bahagian 3 guna 0,380)
  --seg A-B,C-D   bahagian video muka yang sedang bercakap (default 6.5-20.5,29.3-39.4); diulang hingga cukup
  --crop W:H:X:Y  potongan segi empat sekitar muka dari video asal (default 560:560:287:0)
  --nama TEKS     default "RAFEE AILIAH";  --tag "Baris 1|Baris 2"  default "Sahabat Hati|& Fikiran Anda"
"""
import argparse, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont
ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('muka'); ap.add_argument('out'); ap.add_argument('times')
ap.add_argument('--pos', default='-32,770'); ap.add_argument('--seg', default='6.5-20.5,29.3-39.4'); ap.add_argument('--crop', default='560:560:287:0')
ap.add_argument('--nama', default='RAFEE AILIAH'); ap.add_argument('--tag', default='Sahabat Hati|& Fikiran Anda')
a = ap.parse_args()
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'Montserrat.ttf')
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video]))
tA, tP, tE = [float(x) for x in a.times.split(',')]
px, py = [int(x) for x in a.pos.split(',')]
tmp = tempfile.mkdtemp()
S, W, H, P, D = 4, 360, 450, 40, 280
def font(sz, w):
    f = ImageFont.truetype(FONT, sz * S); f.set_variation_by_axes([w]); return f
def big(): return Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
u = big(); d = ImageDraw.Draw(u)
d.ellipse(((P - 6) * S, (P + 4) * S, (P + D + 6) * S, (P + D + 16) * S), fill=(0, 0, 0, 170))
d.ellipse(((P - 10) * S, (P - 10) * S, (P + D + 10) * S, (P + D + 10) * S), fill=(255, 190, 60, 110))
d.rounded_rectangle(((P + 30) * S, (P + D + 30) * S, (P + D - 30) * S, (P + D + 100) * S), radius=30 * S, fill=(0, 0, 0, 150))
u.filter(ImageFilter.GaussianBlur(14 * S)).resize((W, H), Image.LANCZOS).save(f'{tmp}/under.png')
t = big(); d = ImageDraw.Draw(t)
d.ellipse((P * S, P * S, (P + D) * S - 1, (P + D) * S - 1), outline=(255, 212, 90, 255), width=9 * S)
d.ellipse(((P + 9) * S, (P + 9) * S, (P + D - 9) * S - 1, (P + D - 9) * S - 1), outline=(52, 211, 153, 200), width=3 * S)
f = font(26, 800); bb = d.textbbox((0, 0), a.nama, font=f); tw = bb[2] - bb[0]
cx, cy = (P + D / 2) * S, (P + D - 4) * S; pw, ph = tw + 44 * S, 46 * S
d.rounded_rectangle((cx - pw / 2, cy - ph / 2, cx + pw / 2, cy + ph / 2), radius=ph / 2, fill=(6, 32, 42, 255), outline=(255, 212, 90, 255), width=3 * S)
d.text((cx - tw / 2 - bb[0], cy - (bb[3] + bb[1]) / 2), a.nama, font=f, fill=(255, 233, 160, 255))
g = font(25, 700)
for i, line in enumerate(a.tag.split('|')):
    bb = d.textbbox((0, 0), line, font=g); lw = bb[2] - bb[0]
    d.text((cx - lw / 2 - bb[0], (P + D + 34 + i * 32) * S), line, font=g, fill=(255, 255, 255, 255), stroke_width=4 * S, stroke_fill=(2, 19, 26, 255))
t.resize((W, H), Image.LANCZOS).save(f'{tmp}/top.png')
m = Image.new('L', (D * S, D * S), 0); ImageDraw.Draw(m).ellipse((0, 0, D * S - 1, D * S - 1), fill=255); m.resize((D, D), Image.LANCZOS).save(f'{tmp}/mask.png')
# face track: talking segments, graded, looped until long enough
segs = [tuple(map(float, s.split('-'))) for s in a.seg.split(',')]
names = []
for i, (s0, s1) in enumerate(segs):
    n = f'{tmp}/f{i}.mp4'; names.append(n)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(s0), '-t', str(s1 - s0), '-i', a.muka, '-an', '-vf',
                    f'fps=30,crop={a.crop},scale={D}:{D}:flags=lanczos,eq=contrast=1.08:brightness=0.03:saturation=1.12:gamma=1.05,unsharp=5:5:0.6,format=yuv420p',
                    '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', n], check=True)
total = sum(s1 - s0 for s0, s1 in segs); reps = int(dur // total) + 1
open(f'{tmp}/list.txt', 'w').write(''.join(f"file '{n}'\n" for _ in range(reps) for n in names))
P4 = [(0, 350, 120), (tA, 710, 160), (tP, px, py), (tE, 360, 1260)]
def e(i):
    ex = str(P4[-1][i])
    for k in range(len(P4) - 1, 0, -1):
        tt = P4[k][0]; x0 = P4[k - 1][i]; x1 = P4[k][i]; t0 = round(tt - 0.3, 2)
        ex = f"if(lt(t,{t0}),{x0},if(lt(t,{t0 + 0.6:.2f}),{x0}+({x1}-({x0}))*(1-cos(PI*(t-{t0})/0.6))/2,{ex}))"
    return ex
fc = (f"[1:v]format=rgba[f];[2:v]format=gray[m];[f][m]alphamerge[fc];[3:v]format=rgba[u];[u][fc]overlay=40:40:shortest=1[a1];"
      f"[a1][4:v]overlay=0:0:shortest=1,format=rgba,fade=t=in:st=0.2:d=0.5:alpha=1[bub];"
      f"[0:v][bub]overlay=x='{e(1)}':y='{e(2)}':eval=frame:shortest=1,format=yuv420p[v]")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', a.video, '-f', 'concat', '-safe', '0', '-i', f'{tmp}/list.txt',
                '-loop', '1', '-i', f'{tmp}/mask.png', '-loop', '1', '-i', f'{tmp}/under.png', '-loop', '1', '-i', f'{tmp}/top.png',
                '-filter_complex', fc, '-map', '[v]', '-map', '0:a', '-t', str(dur), '-c:v', 'libx264', '-crf', '20', '-preset', 'medium',
                '-threads', '2', '-c:a', 'copy', '-movflags', '+faststart', a.out], check=True)
print(a.out)
