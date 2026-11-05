"""Usage: python3 make_sfx.py timeline.json sfx.wav
Soft, quiet wooshes only (Cikgu: 'woosh yang lembut, tak terlalu kuat'). Peak about -16 dBFS.
Gains: opening 0.16, pop 0.07, card 0.10, end card 0.13. Lower them if he says it is still too loud."""
import json,sys,wave,numpy as np
cfg=json.load(open(sys.argv[1]));sr=48000;N=int(cfg['duration']*sr)+sr;out=np.zeros((N,2))
def woosh(dur,seed,f0=250,f1=3500,f2=600):
    r=np.random.default_rng(seed);n=int(dur*sr);x=r.standard_normal(n);u=np.linspace(0,1,n)
    fc=np.where(u<.45,f0+(f1-f0)*(u/.45)**1.5,f1+(f2-f1)*((u-.45)/.55));a=1-np.exp(-2*np.pi*fc/sr)
    for _ in range(2):  # two one-pole passes = softer slope
        y=np.zeros(n);s=0.
        for i in range(n): s+=a[i]*(x[i]-s);y[i]=s
        x=y
    env=np.sin(np.pi*np.clip(u/.5,0,1)/2)**2*np.where(u>.5,np.exp(-(u-.5)*6),1);z=x*env;z/=np.abs(z).max()
    pan=np.linspace(.25,.75,n);return np.stack([z*np.cos(pan*np.pi/2),z*np.sin(pan*np.pi/2)],1)*1.4
def add(t,w,g):
    i=int(max(0,t)*sr);w=w[:N-i];out[i:i+len(w)]+=w*g
add(0,woosh(1.0,1),.16)
for k,(t,_) in enumerate(cfg['pops']): add(t-.18,woosh(.6,10+k,400,2800,900),.07)
for k,c in enumerate(cfg['cards']): add(c['t']-.2,woosh(.8,30+k),.10)
add(cfg['end']['t']-.2,woosh(1.0,50),.13)
w=wave.open(sys.argv[2],'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr)
w.writeframes((np.clip(out,-1,1)*32767).astype('<i2').tobytes());w.close();print('peak',np.abs(out).max())
