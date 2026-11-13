#!/usr/bin/env python3
"""Soft 'wow' SFX track from the config: woosh at every doodle change,
riser+boom at each `impacts` time, shimmer at `shimmers` times.
usage: make_sfx.py CONFIG.json OUT.wav"""
import sys, json, wave, numpy as np
CFG = json.load(open(sys.argv[1]))
SR = 48000; DUR = CFG['duration']; N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
def db(x): return 10 ** (x / 20)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def lpv(x, a):
    y = np.empty_like(x); acc = 0.0
    av = np.broadcast_to(a, x.shape)
    for i in range(len(x)): acc += av[i] * (x[i] - acc); y[i] = acc
    return y
def add(sig, start, gl=1.0, gr=1.0):
    s = int(max(0, start) * SR); e = min(N, s + len(sig))
    if e > s: L[s:e] += sig[:e - s] * gl; R[s:e] += sig[:e - s] * gr
def norm(y): return y / (np.abs(y).max() + 1e-9)
def whoosh(dur=0.55):
    n = int(dur * SR); t = np.arange(n) / SR
    return norm(lpv(rng.standard_normal(n), np.linspace(0.02, 0.25, n)) * np.sin(np.pi * t / dur) ** 2)
def riser(dur=1.4):
    n = int(dur * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(300 * 6 ** (t / dur)) / SR) * 0.25
    return norm((tone + lpv(rng.standard_normal(n), 0.3) * 0.8) * (t / dur) ** 2.2)
def boom(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 12)) / SR) * np.exp(-t * 2.6)
    return norm(sub + lpv(rng.standard_normal(n), 0.35) * np.exp(-t * 40) * 0.6)
def shimmer(dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for i, m in enumerate([81, 84, 88, 91, 93, 96]):
        st = i * 0.05; y += np.sin(2 * np.pi * midi(m) * t) * np.where(t > st, np.exp(-(t - st) * 2.5), 0)
    return norm(y)

for i, d in enumerate(CFG['doodles'][1:]):
    add(whoosh() * db(-17), d['t0'] - 0.32, 1.0 if i % 2 else 0.6, 0.6 if i % 2 else 1.0)
add(boom() * db(-9), 0.15); add(shimmer() * db(-20), 0.15)
for t in CFG.get('impacts', []):
    add(riser() * db(-17), t - 1.4); add(boom() * db(-8), t - 0.04)
for t in CFG.get('shimmers', []):
    add(shimmer() * db(-17), t)
x = np.clip(np.stack([L, R], 1), -1, 1)
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
print('sfx ->', sys.argv[2])
