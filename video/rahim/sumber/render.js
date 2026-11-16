const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
(async()=>{const [,,dir,mode,out]=process.argv;
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:720,height:1280}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+path.resolve(dir,'index.html'));await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(async()=>{await document.fonts.load('800 40px Cap');await document.fonts.load('700 40px Gold')});
 const grab=async t=>{const d=await p.evaluate(t=>{draw(t);return document.getElementById('c').toDataURL('image/jpeg',0.92)},t);return Buffer.from(d.split(',')[1],'base64')};
 if(mode==='stills'){const ts=[1,5,10,13,17,23,28,36,41,44,50,54,60,64,68,72,79,85,91,99,100.5,103,106];
  for(const t of ts){require('fs').writeFileSync(`${out}/s_${String(t).padStart(5,'0')}.jpg`,await grab(t))}}
 else{const fps=30,N=Math.ceil(107.65*fps);const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',''+fps,'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium',out]);
  for(let i=0;i<N;i++){const buf=await grab(i/fps);if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%300==0)console.log(i,'/',N)}
  ff.stdin.end();await new Promise(r=>ff.on('close',r))}
 await b.close()})();
