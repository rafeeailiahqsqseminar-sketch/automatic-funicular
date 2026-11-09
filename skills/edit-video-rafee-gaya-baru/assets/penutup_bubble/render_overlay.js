// Usage:
//   node render_overlay.js timeline.json OUTDIR full            -> PNG frames (30 fps) only where graphics are active
//   node render_overlay.js timeline.json OUTDIR test 3.5 22 170  -> a few test frames named t<time>.png
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const [cfgPath,out,mode,...rest]=process.argv.slice(2);
 const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 await p.addInitScript(c=>{window.CFG=c},cfg);
 await p.goto('file://'+path.join(__dirname,'overlay.html'));
 await p.evaluate(()=>document.fonts.ready);
 fs.mkdirSync(out,{recursive:true});
 let frames=[];
 if(mode==='test') frames=rest.map(Number).map(t=>({t,n:'t'+t}));
 else{const N=Math.ceil(cfg.duration*30)+1,W=await p.evaluate(()=>WINDOWS);
  for(let i=0;i<N;i++){const t=i/30;if(W.some(([a,b])=>t>=a&&t<=b))frames.push({t,n:String(i).padStart(5,'0')})}}
 console.log('frames',frames.length);
 for(const f of frames){await p.evaluate(async t=>{render(t);const b=document.getElementById('bub');if(b&&b.src){try{await b.decode()}catch(e){}}},f.t);await p.screenshot({path:path.join(out,f.n+'.png'),omitBackground:true})}
 await b.close();
})();
