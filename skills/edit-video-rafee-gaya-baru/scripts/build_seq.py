"""Usage: python3 build_seq.py timeline.json OVERLAY_DIR SEQ_DIR
Fills every frame index 0..N with a symlink: rendered PNG if it exists, else one transparent blank."""
import json,os,sys
from PIL import Image
cfg,ov,seq=sys.argv[1:4];N=int(json.load(open(cfg))['duration']*30)+1
os.makedirs(seq,exist_ok=True);blank=os.path.abspath(os.path.join(seq,'..','blank.png'))
Image.new('RGBA',(1080,1920),(0,0,0,0)).save(blank)
for i in range(N):
    n=f'{i:05d}.png';src=os.path.abspath(os.path.join(ov,n));dst=os.path.join(seq,n)
    if os.path.lexists(dst):os.remove(dst)
    os.symlink(src if os.path.exists(src) else blank,dst)
print('frames',N)
