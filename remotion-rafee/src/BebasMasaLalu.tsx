import React from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {HEART, clamp} from './Mukadimah';
import {IlDefs} from './Ilustrasi';

// "Bebas dari Masa Lalu": a fully animated, text-led reflection (no footage).
// Every beat = one piece of the written script. Consecutive beats that share a visual keep it running.

const amiri = delayRender('Amiri font');
if (typeof FontFace !== 'undefined') {
  new FontFace('Amiri', `url(${staticFile('Amiri-Bold.ttf')})`).load().then((f) => {
    (document.fonts as unknown as {add: (x: FontFace) => void}).add(f);
    continueRender(amiri);
  }).catch(() => continueRender(amiri));
} else continueRender(amiri);

export type Vis = 'bismillah' | 'renung' | 'dna' | 'akbar' | 'hati' | 'beban' | 'mutmainnah' | 'zero' | 'radar' | 'kanvas' | 'fitrah' | 'jemput' | 'akhir';
export type Beat = {d: number; r?: number; vis: Vis; text: string; hl?: string[]}; // r = seconds until the last word is spoken
export type BebasProps = {beats: Beat[]; audio?: string};

const GOLD = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#B86A00 100%)';
const G = 'url(#ilGold)';
const SOFT = '#C9B8FF';
const ease = Easing.inOut(Easing.cubic);
const sp = (f: number, fps: number, d = 14, s = 120) => spring({frame: f, fps, config: {damping: d, stiffness: s}});
const VX = 540;
const VY = 730;

export const beatsTotal = (beats: Beat[]) => beats.reduce((a, b) => a + b.d, 0);

// ---------- background ----------
const Sky: React.FC<{frame: number; warm: number}> = ({frame, warm}) => (
  <>
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, rgba(${40 + warm * 60},${30 + warm * 30},${70 - warm * 20},1) 0%, #0B0A22 45%, #03030C 100%)`}} />
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {new Array(80).fill(0).map((_, i) => {
        const x = (random('bx' + i) * 1080 + Math.sin(frame / 90 + i) * 12) % 1080;
        const s = 0.25 + random('bs' + i) * 0.7;
        const y = (random('by' + i) * 1920 - frame * s + 1920 * 20) % 1920;
        const r = 0.8 + random('br' + i) * 2.4;
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(frame / (14 + random('bt' + i) * 26) + i));
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 4 ? '#FFE9A0' : '#D8CCFF'} opacity={0.45 * tw} />;
      })}
    </svg>
  </>
);

// ---------- small drawing parts ----------
const Helix: React.FC<{h: number; a: number; phase: number; n?: number; col?: string; w?: number; dash?: string}> = ({h, a, phase, n = 46, col = G, w = 7, dash}) => {
  const pts = new Array(n + 1).fill(0).map((_, i) => {
    const y = -h / 2 + (i * h) / n;
    const q = i * 0.34 + phase;
    return {y, x1: a * Math.sin(q), x2: a * Math.sin(q + Math.PI), z: Math.cos(q)};
  });
  const path = (k: 'x1' | 'x2') => pts.map((p, i) => `${i ? 'L' : 'M'}${p[k].toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <g>
      {pts.filter((_, i) => i % 3 === 0).map((p, i) => (
        <line key={i} x1={p.x1} x2={p.x2} y1={p.y} y2={p.y} stroke={col} strokeWidth={w * 0.55} opacity={0.35 + 0.35 * Math.abs(p.z)} strokeDasharray={dash} />
      ))}
      <path d={path('x1')} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <path d={path('x2')} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} opacity={0.8} />
    </g>
  );
};

const Figure: React.FC<{x: number; y: number; s?: number; col?: string; walk?: number; lean?: number; op?: number; sit?: boolean}> = ({x, y, s = 1, col = G, walk, lean = 0, op = 1, sit}) => {
  const sw = walk === undefined ? 0 : Math.sin(walk) * 26;
  const bob = walk === undefined ? 0 : Math.abs(Math.sin(walk)) * -6;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s}) rotate(${lean})`} opacity={op}>
      <circle cx={0} cy={-150} r={30} fill={col} />
      {sit ? (
        <>
          <path d="M-34,-112 Q0,-122 34,-112 L46,-30 Q0,-14 -46,-30 Z" fill={col} />
          <path d="M-46,-34 Q-110,-8 -96,8 Q-40,12 0,-4 Q40,12 96,8 Q110,-8 46,-34 Z" fill={col} />
          <path d="M-34,-104 Q-70,-60 -30,-30 M34,-104 Q70,-60 30,-30" stroke={col} strokeWidth={18} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M-30,-112 Q0,-120 30,-112 L36,-20 L-36,-20 Z" fill={col} />
          <line x1={-14} y1={-24} x2={-14 + sw} y2={50} stroke={col} strokeWidth={22} strokeLinecap="round" />
          <line x1={14} y1={-24} x2={14 - sw} y2={50} stroke={col} strokeWidth={22} strokeLinecap="round" />
          <line x1={-28} y1={-104} x2={-34 - sw * 0.7} y2={-34} stroke={col} strokeWidth={16} strokeLinecap="round" />
          <line x1={28} y1={-104} x2={34 + sw * 0.7} y2={-34} stroke={col} strokeWidth={16} strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

const Rays: React.FC<{f: number; r0: number; r1: number; n?: number; o?: number}> = ({f, r0, r1, n = 18, o = 0.35}) => (
  <g transform={`rotate(${f * 0.15})`} opacity={o}>
    {new Array(n).fill(0).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const b = a + 0.06;
      return <path key={i} d={`M${Math.cos(a) * r0},${Math.sin(a) * r0} L${Math.cos(a) * r1},${Math.sin(a) * r1} L${Math.cos(b) * r1},${Math.sin(b) * r1} Z`} fill="#FFE29A" />;
    })}
  </g>
);

const Glow: React.FC<{r: number; o?: number; y?: number}> = ({r, o = 1, y = 0}) => <circle cx={0} cy={y} r={r} fill="url(#ilGlow)" opacity={o} />;

const Arabic: React.FC<{text: string; size: number; y?: number; k: number}> = ({text, size, y = 0, k}) => (
  <text x={0} y={y} textAnchor="middle" direction="rtl" fontFamily="Amiri" fontSize={size} fill={G}
    style={{filter: 'drop-shadow(0 4px 0 #5A2E00) drop-shadow(0 0 22px rgba(255,200,90,.55))'}} opacity={k}
    transform={`scale(${interpolate(k, [0, 1], [0.9, 1])})`}>
    {text}
  </text>
);

const Wisps: React.FC<{f: number; n: number; r: number; o: number; away?: number}> = ({f, n, r, o, away = 0}) => (
  <g>
    {new Array(n).fill(0).map((_, i) => {
      const a = f / (50 + i * 7) + (i / n) * Math.PI * 2;
      const rr = r + Math.sin(f / 30 + i) * 30 + away * (300 + random('wa' + i) * 300);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.7 - away * 400 * random('wy' + i);
      return (
        <g key={i} transform={`translate(${x},${y})`} opacity={o * (1 - away)}>
          <ellipse rx={34 + random('ws' + i) * 26} ry={22 + random('wt' + i) * 14} fill="rgba(70,60,110,.75)" filter="url(#bmBlur)" />
          <circle cx={-10} cy={-4} r={4} fill="rgba(200,190,255,.6)" />
          <circle cx={10} cy={-4} r={4} fill="rgba(200,190,255,.6)" />
        </g>
      );
    })}
  </g>
);

// ---------- one visual per run ----------
const Visual: React.FC<{vis: Vis; f: number; fps: number; dur: number}> = ({vis, f, fps, dur}) => {
  const t = f / fps;
  const k = sp(f, fps);
  switch (vis) {
    case 'bismillah':
      return (
        <g>
          <Glow r={420 * k} o={0.7} />
          <Rays f={f} r0={160} r1={520} o={0.22 * k} />
          <Arabic text="بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" size={104} y={30} k={k} />
        </g>
      );
    case 'renung': {
      const slow = interpolate(t, [0, dur], [1, 0.15], clamp);
      return (
        <g>
          {new Array(26).fill(0).map((_, i) => {
            const y = -380 + random('ry' + i) * 640;
            const len = 80 + random('rl' + i) * 220;
            const spd = (8 + random('rs' + i) * 18) * slow;
            const x = ((random('rx' + i) * 1600 - f * spd) % 1600 + 1600) % 1600 - 800;
            return <line key={i} x1={x} x2={x + len} y1={y} y2={y} stroke="rgba(220,215,255,.5)" strokeWidth={3 + random('rw' + i) * 4} strokeLinecap="round" opacity={0.25 + 0.5 * slow} />;
          })}
          <Glow r={200 + 140 * (1 - slow)} o={0.5 + 0.5 * (1 - slow)} y={-70} />
          <ellipse cx={0} cy={60} rx={220} ry={26} fill="rgba(255,210,120,.18)" />
          <Figure x={0} y={50} s={1.5 * k} sit />
          <circle cx={0} cy={-110} r={14 + 10 * (1 - slow) + 3 * Math.sin(f / 8)} fill="#FFF6C8" opacity={0.4 + 0.6 * (1 - slow)} filter="url(#bmBlur)" />
        </g>
      );
    }
    case 'dna': {
      const solid = interpolate(t, [12.5, 15.5], [1, 0], clamp);
      const ghost = interpolate(t, [12.0, 16.0], [0, 1], clamp);
      const shimmer = 0.6 + 0.4 * Math.sin(f / 6);
      return (
        <g>
          <rect x={-250} y={-380} width={500} height={760} rx={60} fill="rgba(140,170,255,.05)" stroke="rgba(190,210,255,.35)" strokeWidth={4} opacity={k} />
          <rect x={-226} y={-356} width={18} height={300} rx={9} fill="rgba(255,255,255,.12)" opacity={k} />
          <g transform={`scale(${k})`}>
            <g opacity={ghost * shimmer} filter="url(#bmBlur)">
              <Helix h={620} a={140} phase={f / 18} col="#8FE8FF" w={10} dash="2 16" />
            </g>
            <g opacity={ghost * 0.55}>
              <Helix h={620} a={140} phase={f / 18} col="#E6FAFF" w={4} dash="1 14" />
            </g>
            <g opacity={solid}>
              <Helix h={620} a={140} phase={f / 18} />
            </g>
          </g>
          {ghost > 0
            ? new Array(14).fill(0).map((_, i) => {
                const y = 300 - ((f * (1 + random('dy' + i)) * 2 + random('dz' + i) * 600) % 600);
                return <circle key={i} cx={(random('dx' + i) - 0.5) * 380} cy={y} r={3} fill="#BFF4FF" opacity={ghost * 0.7} />;
              })
            : null}
        </g>
      );
    }
    case 'akbar': {
      return (
        <g>
          <Glow r={460} o={0.8 * k} />
          {[0, 1, 2].map((i) => {
            const p = ((f / fps + i * 1.1) % 3.3) / 3.3;
            return <circle key={i} r={140 + p * 380} fill="none" stroke="#FFE29A" strokeWidth={4} opacity={(1 - p) * 0.6 * k} />;
          })}
          <Rays f={f} r0={200} r1={560} n={24} o={0.18 * k} />
          <Arabic text="ٱللَّٰهُ أَكْبَرُ" size={180} y={50} k={k} />
        </g>
      );
    }
    case 'hati': {
      const beat = 1 + 0.03 * Math.sin(f / 7);
      return (
        <g>
          <Glow r={300} o={0.35} />
          <Wisps f={f} n={7} r={300} o={interpolate(t, [1, 4], [0, 1], clamp)} />
          <g transform={`scale(${3.6 * k * beat})`}>
            <path d={HEART} fill="rgba(120,80,40,.35)" stroke={G} strokeWidth={3} />
            <path d="M-6,-24 L6,-6 L-4,10 L8,30" fill="none" stroke="#2A1E44" strokeWidth={3} strokeLinecap="round" opacity={interpolate(t, [2, 4], [0, 1], clamp)} />
            <path d="M-40,-20 L-28,-8 L-36,6" fill="none" stroke="#2A1E44" strokeWidth={2.4} strokeLinecap="round" opacity={interpolate(t, [3, 5], [0, 1], clamp)} />
          </g>
        </g>
      );
    }
    case 'beban': {
      const walk = f / 5;
      const ballR = 120;
      const bx = -250;
      const by = 180 - ballR;
      return (
        <g>
          <line x1={-520} x2={520} y1={180} y2={180} stroke="rgba(255,226,154,.4)" strokeWidth={4} />
          {new Array(12).fill(0).map((_, i) => {
            const x = ((i * 100 - f * 1.4) % 1200 + 1200) % 1200 - 600;
            return <line key={i} x1={x} x2={x + 40} y1={200} y2={200} stroke="rgba(255,226,154,.25)" strokeWidth={4} strokeLinecap="round" />;
          })}
          <path d={`M${bx + ballR - 10},${by} Q${(bx + 140) / 2},${by + 40 + Math.sin(walk) * 6} 140,${20}`} fill="none" stroke="#8A80A8" strokeWidth={8} strokeDasharray="18 10" />
          <circle cx={bx} cy={by} r={ballR + 40} fill="rgba(60,40,110,.4)" filter="url(#bmBlur)" />
          <circle cx={bx} cy={by} r={ballR} fill="#1C1730" stroke="#5B4E86" strokeWidth={5} />
          <path d={`M${bx - 70},${by - 40} Q${bx},${by - 90} ${bx + 70},${by - 40}`} fill="none" stroke="rgba(200,190,255,.25)" strokeWidth={6} />
          <Wisps f={f} n={4} r={150} o={0.7} />
          <Figure x={210} y={130} s={1.25} walk={walk} lean={14} />
        </g>
      );
    }
    case 'mutmainnah': {
      return (
        <g>
          <circle cx={0} cy={-300} r={70} fill="#FFF3CF" opacity={0.85 * k} filter="url(#bmBlur)" />
          <Glow r={260} y={-300} o={0.6 * k} />
          <Arabic text="يَٰٓأَيَّتُهَا ٱلنَّفْسُ ٱلْمُطْمَئِنَّةُ" size={96} y={-20} k={k} />
          {[0, 1, 2, 3].map((i) => {
            const p = ((t + i * 1.2) % 4.8) / 4.8;
            return <ellipse key={i} cx={0} cy={230} rx={60 + p * 440} ry={12 + p * 70} fill="none" stroke="#FFE29A" strokeWidth={3} opacity={(1 - p) * 0.6 * k} />;
          })}
          <ellipse cx={0} cy={230} rx={30} ry={8} fill="#FFF6C8" opacity={0.8 * k} />
        </g>
      );
    }
    case 'zero': {
      const calm = interpolate(t, [0.5, 4.5], [1, 0], {...clamp, easing: ease});
      const ring = interpolate(t, [5, 8], [0, 1], {...clamp, easing: ease});
      const pts = new Array(121).fill(0).map((_, i) => {
        const x = -440 + i * (880 / 120);
        const y = calm * (Math.sin(i * 0.7 + f * 0.9) * 60 + Math.sin(i * 1.9 - f * 1.3) * 45 + (random('zn' + i + Math.floor(f / 2)) - 0.5) * 90);
        return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      const C = 2 * Math.PI * 230;
      return (
        <g>
          <Glow r={200 + 260 * ring} o={0.3 + 0.6 * ring} />
          <path d={pts} fill="none" stroke={calm > 0.3 ? '#C9B8FF' : '#FFE29A'} strokeWidth={6} strokeLinejoin="round" opacity={1 - ring} />
          <circle r={230} fill="none" stroke={G} strokeWidth={22} strokeDasharray={`${C * ring} ${C}`} transform="rotate(-90)" strokeLinecap="round"
            style={{filter: 'drop-shadow(0 0 24px rgba(255,200,90,.8))'}} />
          <circle r={230 * ring * 0.8} fill="rgba(255,240,200,.06)" />
        </g>
      );
    }
    case 'radar': {
      const ang = f * 3;
      const gate = interpolate(t, [4.4, 7], [0, 1], {...clamp, easing: ease});
      return (
        <g>
          {[110, 210, 310, 410].map((r) => (
            <circle key={r} r={r * k} fill="none" stroke="rgba(255,226,154,.35)" strokeWidth={3} />
          ))}
          <line x1={-420} x2={420} y1={0} y2={0} stroke="rgba(255,226,154,.18)" strokeWidth={2} />
          <line y1={-420} y2={420} x1={0} x2={0} stroke="rgba(255,226,154,.18)" strokeWidth={2} />
          <g transform={`rotate(${ang})`} opacity={1 - gate * 0.6}>
            {new Array(14).fill(0).map((_, i) => {
              const a0 = (-i * 3 * Math.PI) / 180;
              const a1 = (-(i + 1) * 3 * Math.PI) / 180;
              return <path key={i} d={`M0,0 L${410 * Math.cos(a0)},${410 * Math.sin(a0)} A410,410 0 0,0 ${410 * Math.cos(a1)},${410 * Math.sin(a1)} Z`} fill="#FFD45A" opacity={0.35 * (1 - i / 14)} />;
            })}
          </g>
          {[0, 1, 2, 3, 4].map((i) => {
            const ba = random('ra' + i) * 360;
            const br = 120 + random('rr' + i) * 270;
            const since = (((ang - ba) % 360) + 360) % 360;
            return <circle key={i} cx={Math.cos((ba * Math.PI) / 180) * br} cy={Math.sin((ba * Math.PI) / 180) * br} r={10} fill="#FFF3CF" opacity={Math.max(0, 1 - since / 200) * (1 - gate)} />;
          })}
          {/* the gate of Privilege DNA */}
          <g opacity={gate}>
            <Glow r={180 + 200 * gate} o={0.9} />
            <path d="M-120,180 L-120,-60 A120,120 0 0,1 120,-60 L120,180 Z" fill="rgba(255,244,210,.9)" />
            <g transform={`translate(-120,0) scale(${1 - gate * 0.85},1)`}>
              <path d="M0,180 L0,-60 A120,120 0 0,1 120,-108 L120,180 Z" fill="#3A2A12" stroke={G} strokeWidth={6} />
            </g>
            <g transform={`translate(120,0) scale(${1 - gate * 0.85},1)`}>
              <path d="M0,180 L0,-60 A120,120 0 0,0 -120,-108 L-120,180 Z" fill="#3A2A12" stroke={G} strokeWidth={6} />
            </g>
            <g transform="translate(0,50) scale(.42)" opacity={gate}>
              <Helix h={520} a={110} phase={f / 14} col="#B86A00" w={12} />
            </g>
            <path d="M-128,186 L-128,-60 A128,128 0 0,1 128,-60 L128,186" fill="none" stroke={G} strokeWidth={10} />
          </g>
          {gate === 0 ? <circle r={34} fill={G} style={{filter: 'drop-shadow(0 0 20px rgba(255,200,90,.9))'}} /> : null}
        </g>
      );
    }
    case 'kanvas': {
      const shadowO = interpolate(t, [0, 3, 6.5], [0, 0.7, 0.12], clamp);
      const canvasK = sp(f - Math.round(7.6 * fps), fps, 16, 90);
      return (
        <g>
          <g transform="translate(-300,40)" opacity={shadowO} filter="url(#bmBlur)">
            <Figure x={0} y={80} s={1.3} col="#3B3060" />
          </g>
          <g transform={`translate(270,-20) scale(${0.6 + 0.4 * canvasK})`} opacity={interpolate(t, [0.4, 1.6], [0.25, 1], clamp)}>
            <Glow r={330} o={0.4 + 0.6 * canvasK} />
            <Rays f={f} r0={180} r1={420} n={14} o={0.25 * canvasK} />
            <rect x={-150} y={-200} width={300} height={380} rx={10} fill="#FFFDF4" stroke={G} strokeWidth={14} />
            <line x1={-110} x2={-150} y1={180} y2={290} stroke={G} strokeWidth={10} />
            <line x1={110} x2={150} y1={180} y2={290} stroke={G} strokeWidth={10} />
            {new Array(8).fill(0).map((_, i) => (
              <circle key={i} cx={(random('kx' + i) - 0.5) * 240} cy={(random('ky' + i) - 0.5) * 320} r={4 + 4 * Math.abs(Math.sin(f / 9 + i))} fill="#FFD45A" opacity={canvasK} />
            ))}
          </g>
          <Figure x={-40} y={120} s={1.1} walk={f / 7} lean={6} />
        </g>
      );
    }
    case 'fitrah': {
      const clean = interpolate(t, [4.5, 9], [0, 1], {...clamp, easing: ease});
      const beat = 1 + 0.04 * Math.sin(f / 7);
      return (
        <g>
          <Glow r={260 + 260 * clean} o={0.4 + 0.6 * clean} />
          <Rays f={f} r0={200} r1={540} n={22} o={0.28 * clean} />
          <Wisps f={f} n={7} r={260} o={1} away={clean} />
          <g transform={`scale(${3.8 * beat})`}>
            <path d={HEART} fill={clean > 0.02 ? G : 'rgba(120,80,40,.35)'} fillOpacity={0.2 + 0.8 * clean} stroke={G} strokeWidth={3}
              style={{filter: `drop-shadow(0 0 ${6 + 10 * clean}px rgba(255,210,110,.9))`}} />
          </g>
          {new Array(20).fill(0).map((_, i) => {
            const p = ((f * 0.7 + random('fp' + i) * 200) % 200) / 200;
            return <circle key={i} cx={(random('fx' + i) - 0.5) * 500} cy={200 - p * 600} r={3 + random('fr' + i) * 4} fill="#FFF3CF" opacity={(1 - p) * clean} />;
          })}
        </g>
      );
    }
    case 'jemput': {
      const walk = interpolate(t, [0, dur], [0, 1], clamp);
      return (
        <g>
          <path d="M-60,330 L60,330 L22,-60 L-22,-60 Z" fill="rgba(255,226,154,.18)" />
          {new Array(7).fill(0).map((_, i) => {
            const y = 330 - i * 60;
            const w = 60 - i * 6;
            return <line key={i} x1={-w} x2={w} y1={y} y2={y} stroke="rgba(255,226,154,.4)" strokeWidth={4} />;
          })}
          <g transform="translate(0,-150)">
            <Glow r={260} o={0.9} />
            <path d="M-90,90 L-90,-40 A90,90 0 0,1 90,-40 L90,90 Z" fill="#FFF6D8" stroke={G} strokeWidth={10} style={{filter: 'drop-shadow(0 0 30px rgba(255,210,110,.9))'}} />
          </g>
          <Figure x={0} y={interpolate(walk, [0, 1], [300, 40])} s={interpolate(walk, [0, 1], [1, 0.45])} walk={f / 7} col="#FFE9A0" />
        </g>
      );
    }
    default:
      return null;
  }
};

// ---------- text ----------
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9'’\-]/g, '').replace(/^['’]+|['’]+$/g, '');
const markHl = (words: string[], hl: string[] = []) => {
  const on = new Array(words.length).fill(false);
  hl.forEach((ph) => {
    const pw = ph.split(' ').map(norm);
    for (let i = 0; i + pw.length <= words.length; i++) {
      if (pw.every((p, j) => norm(words[i + j]) === p)) for (let j = 0; j < pw.length; j++) on[i + j] = true;
    }
  });
  return on;
};

const BeatText: React.FC<{b: Beat; f: number; fps: number; dur: number; y: number}> = ({b, f, fps, dur, y}) => {
  const words = b.text.split(' ');
  const on = markHl(words, b.hl);
  const len = b.text.length;
  const fs = len < 14 ? 104 : len < 40 ? 76 : len < 80 ? 64 : len < 115 ? 58 : 54;
  const per = b.r ? Math.max(1, (b.r * fps - 4) / Math.max(1, words.length - 1)) : Math.min(5, (dur * fps * 0.45) / words.length);
  const out = interpolate(f, [dur * fps - 10, dur * fps], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: y, left: 60, width: 960, textAlign: 'center', opacity: out,
      filter: `blur(${(1 - out) * 8}px)`, transform: `translateY(-50%) translateY(${(1 - out) * -20}px)`}}>
      <div style={{fontFamily: 'Inter Display', fontWeight: 700, fontSize: fs, lineHeight: 1.22, letterSpacing: -0.5}}>
        {words.map((w, i) => {
          const k = sp(f - 4 - i * per, fps, 16, 140);
          const style: React.CSSProperties = on[i]
            ? {backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 900,
                filter: `drop-shadow(0 3px 0 #5A2E00) blur(${(1 - k) * 6}px)`}
            : {color: '#FFFFFF', textShadow: '0 3px 16px rgba(0,0,0,.85)', filter: `blur(${(1 - k) * 6}px)`};
          return (
            <span key={i} style={{display: 'inline-block', marginRight: '0.26em', opacity: k, transform: `translateY(${(1 - k) * 26}px)`, ...style}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Badge: React.FC<{o: number}> = ({o}) => (
  <div style={{position: 'absolute', top: 150, width: 1080, textAlign: 'center', opacity: o}}>
    <div style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 32, letterSpacing: 8, color: '#FFE9A0',
      padding: '10px 28px', border: '2px solid rgba(255,212,90,.8)', borderRadius: 40, background: 'rgba(10,8,30,.55)'}}>BEBAS DARI MASA LALU</div>
  </div>
);

const EndCard: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const k = sp(f, fps, 14, 110);
  const k2 = sp(f - 70, fps, 10, 160);
  const k3 = sp(f - 150, fps, 16, 100);
  const k4 = sp(f - 300, fps, 16, 100);
  const pulse = 1 + 0.035 * Math.sin(f / 6);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 330, left: 90, width: 900, textAlign: 'center', opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.88, 1])})`}}>
        <div style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 40, letterSpacing: 7, color: '#FFE9A0'}}>MAJLIS ILMU PERCUMA</div>
        <div style={{marginTop: 26, fontFamily: 'Inter Display', fontWeight: 900, fontSize: 150, lineHeight: 0.98, letterSpacing: -3, backgroundImage: GOLD,
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 0 #5A2E00) drop-shadow(0 0 30px rgba(255,190,70,.45))'}}>
          BEBAS<br />DARI MASA<br />LALU
        </div>
        <div style={{marginTop: 60, display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 76, color: '#2A1600',
          backgroundImage: GOLD, borderRadius: 24, padding: '14px 42px', transform: `scale(${k2 * pulse})`, boxShadow: '0 0 50px rgba(255,190,70,.6)'}}>
          KLIK LINK DI BIO
        </div>
      </div>
      <div style={{position: 'absolute', top: 1290, left: 90, width: 900, textAlign: 'center', opacity: k3, transform: `translateY(${(1 - k3) * 30}px)`}}>
        <div style={{fontFamily: 'Inter Display', fontWeight: 600, fontSize: 46, color: 'white', lineHeight: 1.3}}>
          Saya <span style={{fontWeight: 900, backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>Rafee Ailiah</span>,
          <br />sahabat yang mendoakan ketenangan hatimu.
        </div>
      </div>
      <div style={{position: 'absolute', top: 1520, left: 60, width: 960, textAlign: 'center', opacity: k4}}>
        <div style={{fontFamily: 'Amiri', fontSize: 62, color: '#FFE9A0', direction: 'rtl'}}>وَٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ</div>
        <div style={{marginTop: 10, fontFamily: 'Inter Display', fontWeight: 500, fontStyle: 'italic', fontSize: 36, color: 'rgba(255,255,255,.8)'}}>
          Wassalamu'alaikum warahmatullahi wabarakatuh
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BebasMasaLalu: React.FC<BebasProps> = ({beats, audio}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  // locate beat + the start of its visual run
  let acc = 0;
  let bi = 0;
  const starts = beats.map((b) => {
    const s = acc;
    acc += b.d;
    return s;
  });
  starts.forEach((s, i) => {
    if (frame / fps >= s) bi = i;
  });
  const b = beats[bi];
  let ri = bi;
  while (ri > 0 && beats[ri - 1].vis === b.vis) ri--;
  let re = bi;
  while (re + 1 < beats.length && beats[re + 1].vis === b.vis) re++;
  const runStart = Math.round(starts[ri] * fps);
  const runEnd = Math.round((starts[re] + beats[re].d) * fps);
  const vf = frame - runStart;
  const vIn = interpolate(vf, [0, 18], [0, 1], clamp);
  const vOut = interpolate(frame, [runEnd - 14, runEnd], [1, 0], clamp);
  const bf = frame - Math.round(starts[bi] * fps);
  const isEnd = b.vis === 'akhir';
  const warm = interpolate(frame / fps, [starts[0], acc], [0, 1], clamp);
  const fadeAll = interpolate(frame, [durationInFrames - 20, durationInFrames - 1], [1, 0], clamp);
  const badgeO = isEnd || bi === 0 ? 0 : interpolate(frame / fps, [starts[1], starts[1] + 0.8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: '#03030C', overflow: 'hidden'}}>
      <AbsoluteFill style={{opacity: fadeAll}}>
        <Sky frame={frame} warm={warm} />
        <Badge o={badgeO} />
        {!isEnd ? (
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <IlDefs />
            <defs>
              <filter id="bmBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>
            <g transform={`translate(${VX},${VY})`} opacity={vIn * vOut}>
              <Visual vis={b.vis} f={vf} fps={fps} dur={(runEnd - runStart) / fps} />
            </g>
          </svg>
        ) : (
          <EndCard f={bf} fps={fps} />
        )}
        {!isEnd ? <BeatText key={bi} b={b} f={bf} fps={fps} dur={b.d} y={1470} /> : null}
      </AbsoluteFill>
      {audio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
