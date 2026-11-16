import numpy as np, soundfile as sf
sr=44100; T=107.65; n=int(T*sr); t=np.arange(n)/sr
out=np.zeros(n)
# pad lembut (kord minor rendah, naik turun perlahan)
for f,a in [(110,1),(130.8,0.7),(164.8,0.6),(220,0.3)]:
    out+=a*np.sin(2*np.pi*f*t+np.sin(2*np.pi*0.1*t))*(0.6+0.4*np.sin(2*np.pi*0.05*t+f))
env=np.clip(t/3,0,1)*np.clip((T-t)/3,0,1)
out*=0.010*env
# degupan jantung 42.56 -> 61.5 (selari dengan animasi)
def thump(at,amp):
    i=int(at*sr); L=int(0.18*sr)
    if i+L>n: return
    k=np.arange(L)/sr
    out[i:i+L]+=amp*np.sin(2*np.pi*(60-80*k)*k)*np.exp(-k*28)
c=0.0
while c<T:
    if 42.56<=c<=61.5:
        fade=min(1,(c-42.56)/0.6)*(1 if c<56 else max(0,(61.5-c)/5.5))
        thump(c+0.05*0.85,0.22*fade); thump(c+0.22*0.85,0.14*fade)
    c+=0.85
sf.write('sfx.wav',out.astype(np.float32),sr)
