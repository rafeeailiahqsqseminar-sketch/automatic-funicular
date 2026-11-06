import React from 'react';
import {Easing, interpolate, random, spring} from 'remotion';
import {HEART, clamp} from './Mukadimah';

// Small story animations that sit under a card (soul / emotion topics). Drawn in SVG around (0,0), roughly ±340 x ±130.
// Palette: gold + purple + soft white. Every animation takes f = frames since the card started.

export type AnimName =
  | 'sangkar' | 'dinding' | 'rantai' | 'kitaran' | 'kunciTanya'
  | 'terbangBebas' | 'peluk' | 'tenang' | 'bukaKunci' | 'lepaskan' | 'hatiCahaya';

const G = 'url(#ilGold)';
const P = '#A78BFA';
const ease = Easing.out(Easing.cubic);
const sp = (f: number, fps: number, d = 12, s = 150) => spring({frame: f, fps, config: {damping: d, stiffness: s}});

export const IlDefs: React.FC = () => (
  <defs>
    <linearGradient id="ilGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFF6C8" />
      <stop offset=".4" stopColor="#FFD45A" />
      <stop offset=".75" stopColor="#F2B023" />
      <stop offset="1" stopColor="#B86A00" />
    </linearGradient>
    <radialGradient id="ilGlow">
      <stop offset="0" stopColor="rgba(255,226,140,.95)" />
      <stop offset=".5" stopColor="rgba(255,200,90,.35)" />
      <stop offset="1" stopColor="rgba(255,200,90,0)" />
    </radialGradient>
    <radialGradient id="ilPurple">
      <stop offset="0" stopColor="rgba(196,170,255,.9)" />
      <stop offset="1" stopColor="rgba(124,58,237,0)" />
    </radialGradient>
    <filter id="ilBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const Bird: React.FC<{x: number; y: number; s?: number; flap: number; rot?: number}> = ({x, y, s = 1, flap, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={26} ry={17} fill="#FFFDF5" stroke="#3C1C00" strokeWidth={3} />
    <circle cx={22} cy={-12} r={12} fill="#FFFDF5" stroke="#3C1C00" strokeWidth={3} />
    <circle cx={26} cy={-14} r={2.5} fill="#3C1C00" />
    <path d="M33,-12 L44,-8 L33,-5 Z" fill="#F2B023" />
    <path d={`M-4,-6 Q-18,${-36 * flap} -34,${-26 * flap} Q-20,-6 -4,-2 Z`} fill="#E9E3FF" stroke="#3C1C00" strokeWidth={2.5} />
    <path d="M-24,2 L-42,10 L-24,10 Z" fill="#E9E3FF" stroke="#3C1C00" strokeWidth={2} />
  </g>
);

const Cage: React.FC<{door: number; shake?: number}> = ({door, shake = 0}) => (
  <g transform={`translate(${shake},0)`}>
    <path d="M-110,90 L-110,-30 Q-110,-130 0,-130 Q110,-130 110,-30 L110,90" fill="none" stroke={G} strokeWidth={8} filter="url(#ilBlur)" />
    {[-80, -48, -16, 16, 48, 80].map((x) => (
      <line key={x} x1={x} x2={x} y1={x * x * 0.006 - 120 + 30} y2={90} stroke={G} strokeWidth={5} />
    ))}
    <rect x={-125} y={86} width={250} height={18} rx={6} fill={G} stroke="#3C1C00" strokeWidth={3} />
    <circle cx={0} cy={-140} r={12} fill="none" stroke={G} strokeWidth={6} />
    {/* door on the right side, swings open */}
    <g transform={`translate(110,-10) rotate(${-door * 100})`}>
      <rect x={-4} y={-50} width={8} height={100} fill={G} stroke="#3C1C00" strokeWidth={2} />
      <rect x={-4} y={-50} width={60 * (1 - door * 0.6)} height={8} fill={G} />
      <rect x={-4} y={42} width={60 * (1 - door * 0.6)} height={8} fill={G} />
    </g>
  </g>
);

const Padlock: React.FC<{open: number; s?: number}> = ({open, s = 1}) => (
  <g transform={`scale(${s})`}>
    <path d={`M-34,${-10 - open * 34} L-34,${-48 - open * 34} A34,34 0 0 1 34,${-48 - open * 34} L34,${-30 - open * 34}`} fill="none" stroke="#D9D9E3" strokeWidth={12} strokeLinecap="round" />
    <rect x={-54} y={-14} width={108} height={84} rx={14} fill={G} stroke="#3C1C00" strokeWidth={4} />
    <circle cx={0} cy={18} r={11} fill="#3C1C00" />
    <rect x={-4} y={22} width={8} height={24} rx={3} fill="#3C1C00" />
  </g>
);

const Key: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} filter="url(#ilBlur)">
    <circle cx={-70} cy={0} r={28} fill="none" stroke={G} strokeWidth={14} />
    <rect x={-44} y={-7} width={100} height={14} rx={6} fill={G} />
    <rect x={30} y={4} width={10} height={20} fill={G} />
    <rect x={46} y={4} width={10} height={14} fill={G} />
  </g>
);

const Chain: React.FC<{from: number; to: number; y: number; links: number; grow: number; drop?: number}> = ({from, to, y, links, grow, drop = 0}) => (
  <g>
    {new Array(links).fill(0).map((_, i) => {
      const k = clamp && Math.min(1, Math.max(0, grow * links - i));
      if (k <= 0) return null;
      const x = from + ((to - from) * (i + 0.5)) / links;
      const dy = drop * (300 + random('cd' + i + from) * 200) * drop;
      return (
        <ellipse key={i} cx={x} cy={y + (i % 2 ? 0 : 2) + dy} rx={22} ry={13} fill="none" stroke="#C9CCD8" strokeWidth={7}
          opacity={k * (1 - drop)} transform={`rotate(${i % 2 ? 0 : 0} ${x} ${y})`} />
      );
    })}
  </g>
);

const Person: React.FC<{x: number; y: number; s?: number; col?: string; lean?: number; pose?: 'stand' | 'sit'}> = ({x, y, s = 1, col = G, lean = 0, pose = 'stand'}) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${lean})`}>
    {pose === 'sit' ? (
      <>
        <path d="M-70,40 Q0,10 70,40 Q40,60 0,58 Q-40,60 -70,40 Z" fill={col} stroke="#3C1C00" strokeWidth={4} />
        <path d="M-34,40 L-30,-40 Q0,-56 30,-40 L34,40 Z" fill={col} stroke="#3C1C00" strokeWidth={4} />
        <circle cx={0} cy={-72} r={28} fill={col} stroke="#3C1C00" strokeWidth={4} />
      </>
    ) : (
      <>
        <rect x={-24} y={-80} width={48} height={86} rx={20} fill={col} stroke="#3C1C00" strokeWidth={4} />
        <circle cx={0} cy={-108} r={24} fill={col} stroke="#3C1C00" strokeWidth={4} />
      </>
    )}
  </g>
);

const Sparks: React.FC<{f: number; seed: string; n?: number; spread?: number; up?: number; col?: string}> = ({f, seed, n = 18, spread = 300, up = 2.4, col = '#FFE9A0'}) => (
  <g>
    {new Array(n).fill(0).map((_, i) => {
      const d = random(seed + 'd' + i) * 30;
      const k = f - d;
      if (k < 0) return null;
      const x = (random(seed + 'x' + i) - 0.5) * spread * 2;
      const y = 60 - k * up * (0.6 + random(seed + 'v' + i));
      const a = interpolate(k, [0, 6, 40], [0, 1, 0], clamp);
      const r = 3 + random(seed + 'r' + i) * 5;
      return <path key={i} d={`M${x},${y - r * 2} L${x + r * 0.5},${y} L${x},${y + r * 2} L${x - r * 0.5},${y} Z M${x - r * 2},${y} L${x},${y - r * 0.5} L${x + r * 2},${y} L${x},${y + r * 0.5} Z`} fill={col} opacity={a} />;
    })}
  </g>
);

const AnimBody: React.FC<{name: AnimName; f: number; fps: number}> = ({name, f, fps}) => {
  const t = f / fps;
  switch (name) {
    case 'sangkar': {
      // bird trapped in a gold cage: it hops and bumps the bars, cage rattles
      const hop = Math.abs(Math.sin(t * 5)) * 40;
      const bx = Math.sin(t * 2.2) * 50;
      const bump = Math.max(0, Math.abs(bx) - 44) * 0.8;
      return (
        <g>
          <circle r={170} fill="url(#ilPurple)" opacity={0.6} />
          <Bird x={bx} y={40 - hop} flap={0.4 + 0.6 * Math.abs(Math.sin(t * 14))} s={1.1} rot={bx > 0 ? 0 : 0} />
          <Cage door={0} shake={Math.sin(t * 60) * bump * 3} />
        </g>
      );
    }
    case 'dinding': {
      // bricks fall row by row and hide a glowing heart
      const rows = 4;
      const cols = 6;
      return (
        <g>
          <g transform={`translate(0,0) scale(${1 + 0.05 * Math.sin(t * 6)})`} opacity={interpolate(f, [30, 70], [1, 0.25], clamp)}>
            <circle r={110} fill="url(#ilGlow)" />
            <path d={HEART} fill="#FF5C7A" stroke="#FFE9A0" strokeWidth={5} transform="scale(1.1)" />
          </g>
          {new Array(rows * cols).fill(0).map((_, i) => {
            const r = rows - 1 - Math.floor(i / cols);
            const c = i % cols;
            const k = sp(f - 6 - i * 2.2, fps, 14, 200);
            const x = -270 + c * 90 + (r % 2 ? 45 : 0);
            const y = 60 - (rows - 1 - r) * 46;
            return (
              <rect key={i} x={x - 42} y={y - 400 * (1 - k) - 20} width={84} height={40} rx={5} fill="#B5651D" stroke="#5A2E00" strokeWidth={3}
                opacity={k > 0.02 ? 1 : 0} />
            );
          })}
        </g>
      );
    }
    case 'rantai': {
      // chains wrap the heart from both sides, padlock snaps shut, heart dims
      const grow = interpolate(f, [4, 40], [0, 1], {...clamp, easing: ease});
      const lock = sp(f - 40, fps, 9, 220);
      const dim = interpolate(f, [44, 70], [1, 0.45], clamp);
      return (
        <g>
          <g opacity={dim}>
            <circle r={120} fill="url(#ilGlow)" />
            <path d={HEART} fill="#FF5C7A" stroke="#FFE9A0" strokeWidth={5} transform="scale(1.25)" />
          </g>
          <Chain from={-330} to={-10} y={-10} links={9} grow={grow} />
          <Chain from={330} to={10} y={-10} links={9} grow={grow} />
          <Chain from={-300} to={-10} y={50} links={8} grow={grow} />
          <Chain from={300} to={10} y={50} links={8} grow={grow} />
          <g transform={`translate(0,${40 - 30 * (1 - lock)}) scale(${0.7 * lock})`} opacity={lock}>
            <Padlock open={0} />
          </g>
        </g>
      );
    }
    case 'kitaran': {
      // a figure runs around a circle that keeps shrinking: the harder we run, the tighter the loop
      const R = interpolate(f, [0, 150], [150, 70], clamp);
      const a = t * 4.2;
      const px = Math.cos(a) * R * 1.6;
      const py = Math.sin(a) * R * 0.55;
      return (
        <g>
          <ellipse rx={R * 1.6} ry={R * 0.55} fill="none" stroke={P} strokeWidth={6} strokeDasharray="22 16" strokeDashoffset={-f * 4} opacity={0.9} />
          {[0, 1, 2].map((i) => {
            const b = a + 0.5 + i * 2.1;
            return (
              <path key={i} d="M0,-12 L22,0 L0,12 Z" fill="#FFD45A" transform={`translate(${Math.cos(b) * R * 1.6},${Math.sin(b) * R * 0.55}) rotate(${(b * 180) / Math.PI + 90})`} />
            );
          })}
          <g transform={`translate(${px},${py + 30})`}>
            <Person x={0} y={0} s={0.75} lean={Math.cos(a) > 0 ? 12 : -12} />
            <line x1={-14} y1={0} x2={-26 + Math.sin(t * 20) * 14} y2={34} stroke="#B86A00" strokeWidth={10} strokeLinecap="round" />
            <line x1={14} y1={0} x2={26 - Math.sin(t * 20) * 14} y2={34} stroke="#B86A00" strokeWidth={10} strokeLinecap="round" />
          </g>
        </g>
      );
    }
    case 'kunciTanya': {
      // the key glides toward the lock... and stops. A question mark pops: to be continued
      const k = interpolate(f, [4, 50], [0, 1], {...clamp, easing: ease});
      const q = sp(f - 52, fps, 8, 180);
      return (
        <g>
          <circle r={140} fill="url(#ilPurple)" opacity={0.7} />
          <g transform="translate(110,0)">
            <Padlock open={0} s={1.1} />
          </g>
          <Key x={-330 + 280 * k} y={20} rot={0} s={1} />
          <text x={110} y={-90} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={110 * q} fill="#FFE9A0" filter="url(#ilBlur)">
            ?
          </text>
        </g>
      );
    }
    case 'terbangBebas': {
      // cage door opens, bird flies out with a light trail
      const door = interpolate(f, [8, 26], [0, 1], {...clamp, easing: ease});
      const fly = interpolate(f, [24, 90], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
      const bx = interpolate(fly, [0, 0.3, 1], [0, 160, 330]);
      const by = interpolate(fly, [0, 0.3, 1], [30, 0, -170]);
      return (
        <g>
          <circle r={180} fill="url(#ilGlow)" opacity={fly * 0.8} />
          <g transform="translate(-120,0)">
            <Cage door={door} />
            {fly > 0 ? (
              <path d={`M20,30 Q120,40 ${bx},${by}`} fill="none" stroke="#FFE9A0" strokeWidth={4} strokeDasharray="6 10" opacity={0.8 * (1 - fly * 0.5)} />
            ) : null}
            <Bird x={bx} y={by} s={1.1} flap={0.3 + 0.7 * Math.abs(Math.sin(t * (fly > 0 ? 18 : 6)))} rot={-20 * fly} />
          </g>
          <Sparks f={f - 24} seed="fly" n={20} spread={320} />
        </g>
      );
    }
    case 'peluk': {
      // two gold arms wrap around a heart, the heart warms up and glows
      const k = interpolate(f, [4, 40], [0, 1], {...clamp, easing: ease});
      const warm = interpolate(f, [30, 60], [0, 1], clamp);
      const beat = 1 + 0.06 * Math.max(0, Math.sin(t * 7)) * warm;
      return (
        <g>
          <circle r={160 + 20 * warm} fill="url(#ilGlow)" opacity={0.4 + 0.6 * warm} />
          <g transform={`scale(${1.1 * beat})`}>
            <path d={HEART} fill={warm > 0.5 ? '#FF7A95' : '#C98A9A'} stroke="#FFE9A0" strokeWidth={5} />
          </g>
          {[-1, 1].map((sd) => (
            <path key={sd}
              d={`M${sd * 300},120 Q${sd * (300 - 120 * k)},${-20 - 60 * k} ${sd * (210 - 120 * k)},${-110 * k + 10}`}
              fill="none" stroke={G} strokeWidth={34} strokeLinecap="round" filter="url(#ilBlur)" />
          ))}
          <Sparks f={f - 40} seed="peluk" n={14} spread={220} col="#FFC3D0" />
        </g>
      );
    }
    case 'tenang': {
      // a seated figure breathes; a light in the chest grows and sends calm ripples
      const glow = interpolate(f, [6, 50], [0, 1], {...clamp, easing: ease});
      const breath = 1 + 0.03 * Math.sin(t * 2.4);
      return (
        <g>
          {[0, 1, 2].map((i) => {
            const k = ((f - 20 + i * 22) % 66) / 66;
            return f > 20 ? <circle key={i} cx={0} cy={-10} r={40 + k * 230} fill="none" stroke={P} strokeWidth={4} opacity={(1 - k) * 0.8} /> : null;
          })}
          <g transform={`translate(0,70) scale(${1.1 * breath})`}>
            <Person x={0} y={0} pose="sit" col="rgba(40,30,80,.92)" />
          </g>
          <circle cx={0} cy={0} r={18 + 30 * glow} fill="url(#ilGlow)" />
          <circle cx={0} cy={0} r={10 * glow} fill="#FFF6D0" />
        </g>
      );
    }
    case 'bukaKunci': {
      // the key goes in, turns, the shackle pops open and the chains fall away
      const ins = interpolate(f, [4, 30], [0, 1], {...clamp, easing: ease});
      const turn = interpolate(f, [30, 42], [0, 90], clamp);
      const open = sp(f - 42, fps, 8, 200);
      const drop = interpolate(f, [46, 80], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
      return (
        <g>
          <circle r={170} fill="url(#ilGlow)" opacity={open} />
          <Chain from={-340} to={-70} y={10} links={7} grow={1} drop={drop} />
          <Chain from={340} to={70} y={10} links={7} grow={1} drop={drop} />
          <Padlock open={open} s={1.15} />
          <g transform={`translate(${-300 + 245 * ins},28)`}>
            <g transform={`rotate(${turn * 0} ) scale(1,${1 - (turn / 90) * 0.6})`}>
              <Key x={0} y={0} rot={0} s={0.85} />
            </g>
          </g>
          <Sparks f={f - 44} seed="kunci" n={20} spread={300} />
        </g>
      );
    }
    case 'lepaskan': {
      // an open palm lifts up and lets go of light particles that float away
      const k = sp(f - 2, fps, 14, 120);
      return (
        <g>
          <g transform={`translate(0,${70 - 30 * k})`}>
            <path d="M-120,40 Q-130,-10 -90,-20 L-70,-60 Q-60,-80 -45,-60 L-40,-30 L-30,-80 Q-18,-100 -6,-80 L0,-35 L12,-84 Q26,-102 38,-80 L34,-30 L54,-66 Q68,-84 80,-62 L60,0 Q50,40 0,52 Q-90,60 -120,40 Z"
              fill={G} stroke="#3C1C00" strokeWidth={4} transform="rotate(180) scale(1,-1)" />
          </g>
          {new Array(16).fill(0).map((_, i) => {
            const d = 10 + i * 3;
            const q = (f - d) / fps;
            if (q < 0) return null;
            const x = (random('lx' + i) - 0.5) * 120 + (random('lvx' + i) - 0.5) * 300 * q;
            const y = 0 - q * (140 + random('lv' + i) * 120);
            const a = interpolate(q, [0, 0.2, 1.6], [0, 1, 0], clamp);
            return <circle key={i} cx={x} cy={y} r={6 + random('lr' + i) * 8} fill={i % 3 ? '#FFE9A0' : '#C4B5FD'} opacity={a} filter="url(#ilBlur)" />;
          })}
        </g>
      );
    }
    case 'hatiCahaya': {
      // a heart glows from the inside with soft rays and ripples
      const k = sp(f, fps, 10, 140);
      const beat = 1 + 0.07 * Math.max(0, Math.sin(t * 6.5));
      return (
        <g>
          {new Array(12).fill(0).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 + t * 0.4;
            const L = 150 + 40 * Math.sin(t * 3 + i);
            return <line key={i} x1={Math.cos(a) * 100} y1={Math.sin(a) * 100} x2={Math.cos(a) * L} y2={Math.sin(a) * L} stroke="#FFE9A0" strokeWidth={5} strokeLinecap="round" opacity={0.6 * k} />;
          })}
          <circle r={140} fill="url(#ilGlow)" opacity={k} />
          <g transform={`scale(${1.2 * k * beat})`}>
            <path d={HEART} fill="#FF7A95" stroke="#FFF6C8" strokeWidth={6} filter="url(#ilBlur)" />
          </g>
          <Sparks f={f} seed="hati" n={16} spread={260} />
        </g>
      );
    }
  }
};

export const Ilustrasi: React.FC<{name: AnimName; f: number; fps: number; dur: number; x: number; y: number; scale?: number}> = ({name, f, fps, dur, x, y, scale = 1}) => {
  const a = interpolate(f, [0, 8, dur - 8, dur], [0, 1, 1, 0], clamp);
  const pop = sp(f, fps, 14, 160);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <IlDefs />
      <g transform={`translate(${x},${y}) scale(${scale * interpolate(pop, [0, 1], [0.8, 1])})`} opacity={a}>
        <AnimBody name={name} f={f} fps={fps} />
      </g>
    </svg>
  );
};
