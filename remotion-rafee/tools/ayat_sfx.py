"""Usage: python3 tools/ayat_sfx.py OUT.wav
Soft quiet wooshes for the Keajaiban Al-Quran series (same recipe as the gaya baru skill), timed to src/Ayat.tsx:
hook 0 s, ayat 5.2 s, 4 cards from 17.5 s every 7.2 s, end card at 46.3 s. Total 53.8 s."""
import sys, wave, numpy as np
sr = 48000; D = 17.5 + 4 * 7.2 + 7.5; N = int(D * sr); out = np.zeros((N, 2))
def woosh(dur, seed, f0=250, f1=3500, f2=600):
    r = np.random.default_rng(seed); n = int(dur * sr); x = r.standard_normal(n); u = np.linspace(0, 1, n)
    fc = np.where(u < .45, f0 + (f1 - f0) * (u / .45) ** 1.5, f1 + (f2 - f1) * ((u - .45) / .55)); a = 1 - np.exp(-2 * np.pi * fc / sr)
    for _ in range(2):
        y = np.zeros(n); s = 0.
        for i in range(n): s += a[i] * (x[i] - s); y[i] = s
        x = y
    env = np.sin(np.pi * np.clip(u / .5, 0, 1) / 2) ** 2 * np.where(u > .5, np.exp(-(u - .5) * 6), 1); z = x * env; z /= np.abs(z).max()
    pan = np.linspace(.25, .75, n); return np.stack([z * np.cos(pan * np.pi / 2), z * np.sin(pan * np.pi / 2)], 1) * 1.4
def add(t, w, g):
    i = int(max(0, t) * sr); w = w[:N - i]; out[i:i + len(w)] += w * g
add(0, woosh(1.0, 1), .16)
add(5.2 - .2, woosh(.9, 2), .12)
for k in range(4): add(17.5 + k * 7.2 - .2, woosh(.8, 30 + k), .10)
add(17.5 + 4 * 7.2 - .2, woosh(1.0, 50), .13)
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes()); w.close(); print('peak', np.abs(out).max())
