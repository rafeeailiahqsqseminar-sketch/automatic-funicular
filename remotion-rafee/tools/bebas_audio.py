"""Soft ambient bed for 'Bebas dari Masa Lalu': warm drone + gentle chime at each visual change.
Usage: python3 tools/bebas_audio.py <total_seconds> <change_times_csv> <out.wav>"""
import sys, wave
import numpy as np

sr = 44100
T = float(sys.argv[1]); changes = [float(x) for x in sys.argv[2].split(',') if x]; out = sys.argv[3]
t = np.arange(int(T * sr)) / sr
rng = np.random.default_rng(7)
pad = np.zeros_like(t)
for f, a in [(73.42, .30), (110.0, .22), (146.83, .16), (220.0, .08), (164.81, .07), (293.66, .04)]:
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * (0.05 + rng.random() * 0.06) * t + rng.random() * 6)
    pad += a * lfo * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 1.003 * t))
# airy noise, low-passed
n = rng.standard_normal(len(t))
k = np.ones(400) / 400
air = np.convolve(n, k, mode='same') * 0.6
sig = pad * 0.5 + air
# chimes
for c in changes:
    i0 = int(c * sr)
    L = min(len(t) - i0, int(4 * sr))
    if L <= 0: continue
    tt = np.arange(L) / sr
    env = np.exp(-tt * 1.6) * np.minimum(1, tt / 0.01)
    bell = sum(a * np.sin(2 * np.pi * f * tt) for f, a in [(880, .5), (1320, .25), (1760, .12), (2637, .06)])
    sig[i0:i0 + L] += 0.10 * env * bell
fade = np.minimum(1, t / 3) * np.minimum(1, (T - t) / 3)
sig *= fade
sig = sig / np.max(np.abs(sig)) * 0.32
st = np.stack([sig, np.roll(sig, 300)], 1)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
