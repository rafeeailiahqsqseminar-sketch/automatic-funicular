import json,re
html=open('anim/index.html').read()
caps=re.findall(r'^\[([\d.]+),(null|"[^"]*")(,1)?\]',html,re.M)
W=json.load(open('words.json'))
out=[]
for i,(st,txt,em) in enumerate(caps):
    st=float(st)
    if txt=='null': out.append([st,None,0,[]]);continue
    en=float(caps[i+1][0])
    txt=json.loads(txt); words=txt.split(' ')
    ws=[w[0] for w in W if st-0.05<=w[0]<en-0.05]
    if not ws: ws=[st]
    n=len(words)
    if len(ws)==n: ts=ws
    else:
        ts=[]
        for k in range(n):
            f=k*(len(ws)-1)/max(1,n-1); a=int(f); b=min(a+1,len(ws)-1)
            ts.append(ws[a]+(ws[b]-ws[a])*(f-a))
    ts=[max(st,t) for t in ts]
    out.append([st,txt,1 if em else 0,[[w,round(t,2)] for w,t in zip(words,ts)]])
open('anim/capwords.js','w').write('const CAPW='+json.dumps(out,ensure_ascii=False)+';')
