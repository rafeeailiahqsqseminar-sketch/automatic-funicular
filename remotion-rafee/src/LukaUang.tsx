import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// "Kenali Luka Uang Dalam Diri": full motion-graphics rebuild of a 96 s slide video over a cleaned VO (repeats cut).
// Each scene: big drawn number, kicker, title words that spring in as they are spoken, karaoke body text and a story illustration.

type W = {w: string; s: number; e: number};
export type LukaScene = {t: number; num: string; kicker: string; title: string[]; hl: string; tw: number[]; body: W[]};
export type LukaUangProps = {audio: string; duration: number; scenes: LukaScene[]};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GOLD = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#C77A00 100%)';
const GC = '#F6B533';
const NAVY = '#0B1A33';
const SKIN = '#F5C28B';
const SHIRT = '#F6A623';
const PANTS = '#2C4A7A';
const INK = '#3A2410';
const FONT = 'Inter Display';
const ci = (v: number, a: number[], b: number[]) => interpolate(v, a, b, clamp);

const useSp = () => {
  const {fps} = useVideoConfig();
  return (f: number, d = 12, s = 160) => spring({frame: f, fps, config: {damping: d, stiffness: s}});
};

// ---------------- background ----------------
const Background: React.FC<{f: number; scene: number}> = ({f, scene}) => {
  const hue = [0, 0, 0, 0, 0, 0, 0, 0][scene] ?? 0;
  const gx = 50 + 18 * Math.sin(f / 140);
  const gy = 30 + 10 * Math.cos(f / 170);
  return (
    <AbsoluteFill style={{filter: `hue-rotate(${hue}deg)`}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${gx}% ${gy}%, #1F3E6E 0%, #12284A 35%, #081428 75%, #040A16 100%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="bk">
            <stop offset="0" stopColor="rgba(255,214,120,.9)" />
            <stop offset=".6" stopColor="rgba(255,190,80,.35)" />
            <stop offset="1" stopColor="rgba(255,190,80,0)" />
          </radialGradient>
        </defs>
        {/* bokeh coins */}
        {new Array(34).fill(0).map((_, i) => {
          const depth = 0.3 + random('bd' + i) * 0.7;
          const x = (random('bx' + i) * 1180 - 50 + Math.sin(f / (60 + i * 3) + i) * 30 * depth) % 1180;
          const y = ((random('by' + i) * 2100 - f * 0.9 * depth + 2100 * 20) % 2100) - 90;
          const r = 6 + depth * 22;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (25 + random('bt' + i) * 30) + i));
          return <circle key={i} cx={x} cy={y} r={r} fill="url(#bk)" opacity={0.55 * tw * depth} />;
        })}
        {/* drifting RM notes */}
        {new Array(12).fill(0).map((_, i) => {
          const depth = 0.4 + random('nd' + i) * 0.6;
          const x = random('nx' + i) * 1080 + Math.sin(f / 50 + i) * 40;
          const y = ((random('ny' + i) * 2200 + f * 1.3 * depth) % 2200) - 140;
          const rot = random('nr' + i) * 360 + f * (random('ns' + i) - 0.5) * 1.6;
          const sx = Math.cos(f / 22 + i);
          return (
            <g key={'n' + i} transform={`translate(${x},${y}) rotate(${rot}) scale(${depth * sx},${depth})`} opacity={0.16 + depth * 0.14}>
              <rect x={-46} y={-24} width={92} height={48} rx={6} fill="#2E8B57" stroke="#7FD49B" strokeWidth={3} />
              <circle cx={0} cy={0} r={12} fill="none" stroke="#9BE3B2" strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

// ---------------- character ----------------
type Mood = 'smile' | 'worry' | 'sad' | 'calm';
const Person: React.FC<{x: number; y: number; s?: number; armL?: number; armR?: number; lean?: number; mood?: Mood; bob?: number; flipX?: boolean}> = ({
  x, y, s = 1, armL = 20, armR = -20, lean = 0, mood = 'calm', bob = 0, flipX = false,
}) => {
  const arm = (side: number, ang: number) => (
    <g transform={`translate(${side * 44},-212) rotate(${ang})`}>
      <rect x={-13} y={-6} width={26} height={104} rx={13} fill={SHIRT} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={102} r={15} fill={SKIN} stroke={INK} strokeWidth={4} />
    </g>
  );
  const mouth = {
    smile: 'M-14,-246 Q0,-232 14,-246',
    calm: 'M-12,-243 Q0,-238 12,-243',
    worry: 'M-12,-238 Q0,-248 12,-238',
    sad: 'M-14,-234 Q0,-250 14,-234',
  }[mood];
  return (
    <g transform={`translate(${x},${y + bob}) scale(${flipX ? -s : s},${s}) rotate(${lean})`}>
      <ellipse cx={0} cy={6} rx={70} ry={12} fill="rgba(0,0,0,.35)" />
      <rect x={-36} y={-112} width={30} height={116} rx={12} fill={PANTS} stroke={INK} strokeWidth={4} />
      <rect x={6} y={-112} width={30} height={116} rx={12} fill={PANTS} stroke={INK} strokeWidth={4} />
      {arm(-1, armL)}
      <rect x={-52} y={-236} width={104} height={140} rx={34} fill={SHIRT} stroke={INK} strokeWidth={4} />
      {arm(1, armR)}
      <circle cx={0} cy={-280} r={46} fill={SKIN} stroke={INK} strokeWidth={4} />
      <path d="M-46,-286 Q-44,-336 0,-334 Q46,-336 46,-286 Q30,-308 0,-306 Q-28,-310 -46,-286 Z" fill="#3B2412" />
      <circle cx={-16} cy={-274} r={5} fill={INK} />
      <circle cx={16} cy={-274} r={5} fill={INK} />
      {mood === 'worry' || mood === 'sad' ? (
        <>
          <path d="M-26,-292 L-8,-286" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M26,-292 L8,-286" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </>
      ) : null}
      <path d={mouth} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

const Coin: React.FC<{x: number; y: number; r?: number; spin?: number; label?: string}> = ({x, y, r = 40, spin = 0, label = 'RM'}) => {
  const sx = Math.max(0.08, Math.abs(Math.cos(spin)));
  return (
    <g transform={`translate(${x},${y}) scale(${sx},1)`}>
      <circle r={r} fill="url(#luGold)" stroke="#8A5200" strokeWidth={r * 0.1} />
      <circle r={r * 0.74} fill="none" stroke="#FFF2B8" strokeWidth={r * 0.06} opacity={0.8} />
      {sx > 0.4 ? (
        <text y={r * 0.22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.62} fill="#7A4300">{label}</text>
      ) : null}
    </g>
  );
};

const Sparks: React.FC<{f: number; seed: string; cx: number; cy: number; n?: number; spread?: number}> = ({f, seed, cx, cy, n = 22, spread = 260}) => (
  <g>
    {new Array(n).fill(0).map((_, i) => {
      const d = random(seed + 'd' + i) * 18;
      const k = f - d;
      if (k < 0 || k > 45) return null;
      const ang = random(seed + 'a' + i) * Math.PI * 2;
      const dist = (0.3 + random(seed + 'v' + i)) * spread * Easing.out(Easing.cubic)(Math.min(1, k / 40));
      const x = cx + Math.cos(ang) * dist;
      const y = cy + Math.sin(ang) * dist - k * 0.8;
      const r = 4 + random(seed + 'r' + i) * 7;
      const a = ci(k, [0, 5, 45], [0, 1, 0]);
      return (
        <path key={i} fill="#FFE9A0" opacity={a}
          d={`M${x},${y - r * 2} L${x + r * 0.45},${y - r * 0.45} L${x + r * 2},${y} L${x + r * 0.45},${y + r * 0.45} L${x},${y + r * 2} L${x - r * 0.45},${y + r * 0.45} L${x - r * 2},${y} L${x - r * 0.45},${y - r * 0.45} Z`} />
      );
    })}
  </g>
);

// ---------------- illustrations (origin = ground centre at 540, 1640) ----------------
const Illus: React.FC<{i: number; f: number; dur: number}> = ({i, f, dur}) => {
  const sp = useSp();
  const t = f / 30;
  const enter = sp(f - 4, 14, 120);
  const breathe = Math.sin(f / 14) * 3;
  let body: React.ReactNode = null;

  if (i === 0) {
    // heavy money bag drops, ground shakes, character struggles to lift it
    const drop = ci(f, [10, 26], [-700, 0]);
    const land = f >= 26;
    const shake = land ? Math.sin(f * 2.2) * ci(f, [26, 46], [12, 0]) : 0;
    const lift = Math.max(0, Math.sin((f - 60) / 22)) * ci(f, [60, 80], [0, 14]);
    const sink = ci(f, [26, 34], [0, 18]);
    body = (
      <g transform={`translate(${shake},0)`}>
        <Person x={-170} y={0} armR={-60 + Math.sin(f / 8) * 6} armL={10} mood={land ? 'worry' : 'calm'} lean={land ? 6 : 0} bob={breathe} />
        <g transform={`translate(110,${drop + sink * 0.2 - lift})`}>
          <ellipse cx={0} cy={0} rx={150 * (land ? 1 : 0.6)} ry={22} fill="rgba(0,0,0,.4)" />
          <path d="M-130,-10 Q-150,-190 -40,-230 L-60,-280 Q0,-300 60,-280 L40,-230 Q150,-190 130,-10 Q0,20 -130,-10 Z" fill="#C99A55" stroke={INK} strokeWidth={5} />
          <path d="M-50,-236 Q0,-218 50,-236" stroke={INK} strokeWidth={8} fill="none" />
          <text x={0} y={-90} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={96} fill="#6B3E00">RM</text>
          <g transform={`translate(0,${-330 - Math.max(0, Math.sin(f / 10)) * 10})`} opacity={ci(f, [34, 44], [0, 1])}>
            <rect x={-80} y={-40} width={160} height={70} rx={14} fill="#E8312A" stroke="#FFF" strokeWidth={4} />
            <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#FFF">BERAT</text>
          </g>
        </g>
        {land
          ? new Array(10).fill(0).map((_, k) => {
              const a = ci(f, [26, 50], [0.8, 0]);
              const dx = (k - 4.5) * 34 * ci(f, [26, 50], [0.5, 2.2]);
              return <circle key={k} cx={110 + dx} cy={-10 - ci(f, [26, 50], [0, 40]) * random('dust' + k)} r={10 + random('dr' + k) * 14} fill="#C9B79A" opacity={a} />;
            })
          : null}
      </g>
    );
  } else if (i === 1) {
    // takut kurang: hugs a wallet tight, a padlock snaps on, coins try to escape and get pulled back
    const lock = sp(f - 40, 9, 200);
    const tremble = Math.sin(f * 1.7) * 2.5;
    body = (
      <g>
        <Person x={0} y={0} armL={-58} armR={58} mood="worry" bob={breathe} lean={tremble} />
        <g transform={`translate(${tremble},-170)`}>
          <rect x={-70} y={-50} width={140} height={96} rx={16} fill="#7A4A1E" stroke={INK} strokeWidth={5} />
          <rect x={10} y={-20} width={70} height={40} rx={10} fill="#93602C" stroke={INK} strokeWidth={4} />
          <g transform={`translate(0,${ci(lock, [0, 1], [-200, 30])}) scale(${0.6 + lock * 0.4})`} opacity={lock}>
            <path d="M-26,-30 L-26,-56 Q0,-90 26,-56 L26,-30" fill="none" stroke="#D9D9D9" strokeWidth={10} />
            <rect x={-38} y={-32} width={76} height={62} rx={10} fill="url(#luGold)" stroke="#7A4300" strokeWidth={4} />
            <circle cx={0} cy={-4} r={8} fill="#7A4300" />
          </g>
        </g>
        {[0, 1, 2].map((k) => {
          const ph = ((f + k * 22) % 66) / 66;
          const out = Math.sin(ph * Math.PI);
          return <Coin key={k} x={(k - 1) * 150 + out * (k - 1) * 60} y={-200 - out * 210} r={34} spin={f / 6 + k} />;
        })}
        {[-1, 1].map((k) => (
          <path key={k} d={`M${k * 70},-330 q${k * 6},18 0,26 q${-k * 6},-8 0,-26 Z`} fill="#8FD3FF" opacity={0.5 + 0.5 * Math.sin(f / 6 + k)} transform={`translate(0,${(f % 30) * 1.2})`} />
        ))}
      </g>
    );
  } else if (i === 2) {
    // rasa tak layak: a door of opportunity opens with light, the person steps back and it closes
    const open = ci(f, [10, 40], [0, 1]) * ci(t, [dur - 2.2, dur - 1.2], [1, 0.12]);
    const back = ci(f, [50, 90], [0, -90]);
    const rays = open;
    body = (
      <g>
        <g transform="translate(180,0)">
          <polygon points="-90,-420 90,-420 300,0 -300,0" fill="rgba(255,226,140,.18)" opacity={rays} />
          <rect x={-90} y={-420} width={180} height={420} fill="#FFF3C4" opacity={0.35 + 0.65 * rays} />
          {new Array(9).fill(0).map((_, k) => (
            <line key={k} x1={0} y1={-210} x2={Math.cos((k / 8) * Math.PI + Math.PI) * 420} y2={-210 + Math.sin((k / 8) * Math.PI + Math.PI) * 420}
              stroke="rgba(255,222,130,.35)" strokeWidth={10} opacity={rays * (0.5 + 0.5 * Math.sin(f / 10 + k))} />
          ))}
          <g transform={`translate(-90,0) scale(${1 - open * 0.85},1)`}>
            <rect x={0} y={-420} width={180} height={420} fill="#5B3A1E" stroke={GC} strokeWidth={6} />
            <circle cx={150} cy={-200} r={9} fill={GC} />
          </g>
          <rect x={-96} y={-426} width={192} height={426} fill="none" stroke={GC} strokeWidth={8} />
          <text x={0} y={-460} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#FFE9A0" opacity={rays}>PELUANG</text>
        </g>
        <Person x={-150 + back} y={0} armR={ci(f, [50, 70], [-20, -95])} armL={20} mood="sad" lean={ci(f, [50, 70], [0, -8])} bob={breathe} />
      </g>
    );
  } else if (i === 3) {
    // nilai diri dari harta: shopping bags drop and pile up, a "self-worth" bar only rises with the bags
    const bags = [0, 1, 2, 3, 4, 5];
    const shown = bags.filter((k) => f >= 20 + k * 22).length;
    body = (
      <g>
        <Person x={-160} y={0} armR={-70 + Math.sin(f / 9) * 5} armL={30} mood="smile" bob={breathe} />
        {bags.map((k) => {
          const f0 = 20 + k * 22;
          const p = sp(f - f0, 10, 180);
          if (f < f0) return null;
          const col = ['#E8312A', '#8E5CF6', '#16A34A', '#2F80ED', '#F2994A', '#EC4899'][k];
          const bx = 60 + (k % 3) * 120;
          const by = -Math.floor(k / 3) * 150;
          return (
            <g key={k} transform={`translate(${bx},${by - (1 - p) * 500}) rotate(${(1 - p) * 30 * (k % 2 ? 1 : -1)})`}>
              <path d="M-30,-128 Q-30,-170 0,-170 Q30,-170 30,-128" fill="none" stroke={INK} strokeWidth={6} />
              <rect x={-55} y={-130} width={110} height={130} rx={10} fill={col} stroke={INK} strokeWidth={5} />
              <g transform="translate(36,-108) rotate(18)">
                <rect x={-24} y={-14} width={48} height={28} rx={5} fill="#FFF" stroke={INK} strokeWidth={3} />
                <text x={0} y={8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={18} fill={INK}>RM</text>
              </g>
            </g>
          );
        })}
        <g transform="translate(-400,-380)">
          <rect x={0} y={0} width={36} height={320} rx={18} fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.4)" strokeWidth={3} />
          <rect x={4} y={316 - (shown / 6) * 312} width={28} height={(shown / 6) * 312} rx={14} fill="url(#luGold)" />
          <text x={18} y={-18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#FFE9A0">HARGA DIRI?</text>
        </g>
      </g>
    );
  } else if (i === 4) {
    // wang itu ancaman: a coin approaches, a red warning flashes, the person pushes it away
    const cycle = f % 90;
    const cx = ci(cycle, [0, 40, 52, 90], [420, 90, 90, 460]);
    const push = ci(cycle, [36, 46, 70], [0, 1, 0]);
    const warn = 0.5 + 0.5 * Math.sin(f / 4);
    body = (
      <g>
        <Person x={-120} y={0} armR={-90 + -push * 20} armL={-70 - push * 10} mood="worry" lean={-6 * push} bob={breathe} flipX />
        <Coin x={cx} y={-200 - Math.abs(Math.sin(f / 7)) * 30} r={70} spin={f / 7} />
        <g transform="translate(-330,-330)" opacity={ci(f, [10, 20], [0, 1])}>
          <polygon points="0,-70 72,56 -72,56" fill="#E8312A" stroke="#FFF" strokeWidth={6} opacity={0.6 + 0.4 * warn} transform={`scale(${1 + warn * 0.06})`} />
          <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={76} fill="#FFF">!</text>
        </g>
        {['TAMAK', 'JAHAT', 'MUFLIS'].map((w, k) => {
          const p = sp(f - (110 + k * 18), 10, 200);
          return (
            <g key={w} transform={`translate(${230 + (k - 1) * 30},${-430 + k * 84}) scale(${p})`} opacity={p}>
              <rect x={-110} y={-36} width={220} height={66} rx={33} fill="rgba(232,49,42,.9)" stroke="#FFF" strokeWidth={3} />
              <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill="#FFF">{w}</text>
            </g>
          );
        })}
      </g>
    );
  } else if (i === 5) {
    // beban rasa bersalah: a heavy boulder lands on the back; a sun of "senang" shines but the weight stays
    const p = sp(f - 12, 9, 140);
    const bend = ci(p, [0, 1], [0, 18]) + Math.sin(f / 10) * 2;
    const sun = sp(f - 110, 14, 90);
    body = (
      <g>
        <g transform={`translate(340,-380) scale(${sun})`} opacity={sun}>
          <circle r={70} fill="url(#luGold)" />
          {new Array(10).fill(0).map((_, k) => (
            <line key={k} x1={0} y1={-92} x2={0} y2={-120} stroke="#FFD45A" strokeWidth={8} strokeLinecap="round" transform={`rotate(${k * 36 + f})`} />
          ))}
          <text y={160} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill="#FFE9A0">HIDUP SENANG</text>
        </g>
        <Person x={-40} y={0} armL={-40} armR={-150} lean={bend} mood="sad" bob={breathe} />
        <g transform={`translate(${-40 + bend * 7},${-360 - (1 - p) * 700}) rotate(${bend})`}>
          <path d="M-130,40 Q-160,-60 -70,-110 Q20,-150 100,-90 Q170,-30 130,40 Q0,80 -130,40 Z" fill="#6B7280" stroke="#1F2937" strokeWidth={6} />
          <path d="M-60,-60 Q-20,-80 20,-56" stroke="#9CA3AF" strokeWidth={8} fill="none" strokeLinecap="round" />
          <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill="#F3F4F6">BERSALAH</text>
        </g>
      </g>
    );
  } else if (i === 6) {
    // kenal pasti: five wound badges, a magnifier sweeps and settles, the chosen one glows
    const sweep = ci(f, [8, 80], [0, 1]);
    const mx = interpolate(Easing.inOut(Easing.cubic)(sweep), [0, 0.25, 0.5, 0.75, 1], [-360, -180, 180, 360, 0]);
    const pick = sp(f - 82, 10, 160);
    body = (
      <g>
        {[0, 1, 2, 3, 4].map((k) => {
          const x = (k - 2) * 180;
          const p = sp(f - k * 4, 12, 180);
          const chosen = k === 2;
          const g = chosen ? pick : 0;
          return (
            <g key={k} transform={`translate(${x},${-200 - g * 60}) scale(${p * (1 + g * 0.35)})`} opacity={chosen ? 1 : 1 - pick * 0.55}>
              <circle r={70} fill={chosen && pick > 0.1 ? 'url(#luGold)' : 'rgba(255,255,255,.1)'} stroke={GC} strokeWidth={5} />
              <text y={30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill={chosen && pick > 0.1 ? '#6B3E00' : '#FFE9A0'}>{k + 1}</text>
            </g>
          );
        })}
        <g transform={`translate(${mx + 40},${-160 - pick * 60})`} opacity={1 - pick * 0.2}>
          <circle r={96} fill="rgba(180,220,255,.12)" stroke="#E5E7EB" strokeWidth={14} />
          <line x1={70} y1={70} x2={170} y2={170} stroke="#E5E7EB" strokeWidth={26} strokeLinecap="round" />
        </g>
        {f > 82 ? <Sparks f={f - 82} seed="pick" cx={0} cy={-260} /> : null}
      </g>
    );
  } else if (i === 7) {
    // wang bukan musuh, ia alat: a coin flips into a key; coins flow along a path into a growing plant
    const flip = ci(f, [10, 40], [0, Math.PI * 3]);
    const toKey = ci(f, [36, 46], [0, 1]);
    const grow = sp(f - 70, 16, 70);
    body = (
      <g>
        <g transform="translate(-230,-330)">
          <g opacity={1 - toKey}>
            <Coin x={0} y={0} r={90} spin={flip} />
          </g>
          <g opacity={toKey} transform={`scale(${0.6 + toKey * 0.4}) rotate(${-30 + Math.sin(f / 20) * 8})`}>
            <circle cx={0} cy={-60} r={56} fill="none" stroke="url(#luGold)" strokeWidth={26} />
            <rect x={-13} y={-10} width={26} height={170} rx={8} fill="url(#luGold)" />
            <rect x={13} y={100} width={44} height={22} rx={6} fill="url(#luGold)" />
            <rect x={13} y={136} width={30} height={22} rx={6} fill="url(#luGold)" />
          </g>
          <text y={190} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#FFE9A0" opacity={toKey}>ALAT</text>
        </g>
        <path d="M-120,-330 C40,-420 120,-160 230,-120" fill="none" stroke="rgba(255,226,140,.35)" strokeWidth={6} strokeDasharray="14 16" strokeDashoffset={-f * 3} opacity={toKey} />
        {f > 50
          ? [0, 1, 2, 3].map((k) => {
              const q = (((f - 50) / 40 + k / 4) % 1);
              const bx = Math.pow(1 - q, 3) * -120 + 3 * Math.pow(1 - q, 2) * q * 40 + 3 * (1 - q) * q * q * 120 + q * q * q * 230;
              const by = Math.pow(1 - q, 3) * -330 + 3 * Math.pow(1 - q, 2) * q * -420 + 3 * (1 - q) * q * q * -160 + q * q * q * -120;
              return <Coin key={k} x={bx} y={by} r={24} spin={f / 5 + k} />;
            })
          : null}
        <g transform="translate(260,0)">
          <path d="M-90,0 L-70,-90 L70,-90 L90,0 Z" fill="#8B5A2B" stroke={INK} strokeWidth={5} />
          <path d={`M0,-90 C-6,${-90 - 120 * grow} 10,${-90 - 220 * grow} 0,${-90 - 300 * grow}`} stroke="#22C55E" strokeWidth={14} fill="none" strokeLinecap="round" />
          {[0.45, 0.7, 0.92].map((h, k) => {
            const lp = ci(grow, [h - 0.3, h], [0, 1]);
            const yy = -90 - 300 * grow * h;
            return (
              <g key={k} transform={`translate(0,${yy}) scale(${lp * (k % 2 ? -1 : 1)},${lp})`}>
                <path d="M0,0 C30,-50 90,-40 110,-10 C70,10 30,10 0,0 Z" fill="#4ADE80" stroke="#166534" strokeWidth={4} />
              </g>
            );
          })}
          <g transform={`translate(0,${-100 - 300 * grow})`} opacity={grow > 0.9 ? 1 : 0}>
            <Coin x={0} y={0} r={36} spin={f / 8} />
          </g>
        </g>
      </g>
    );
  }

  return (
    <g transform={`translate(540,1650) scale(${0.85 + enter * 0.15})`} opacity={enter}>
      {body}
    </g>
  );
};

// ---------------- text blocks ----------------
const Title: React.FC<{sc: LukaScene; f: number; fps: number; center: boolean; y: number}> = ({sc, f, fps, center, y}) => {
  const sp = useSp();
  const t0 = sc.t;
  const words: {w: string; line: number; s: number}[] = [];
  const all = sc.title.flatMap((l, li) => l.split(' ').map((w) => ({w, line: li})));
  const tw = sc.tw.length ? sc.tw : [t0 + 0.3];
  // spread title words over the spoken title window (last spoken title words)
  const first = tw[Math.max(0, tw.length - all.length)] ?? tw[0];
  const last = tw[tw.length - 1] + 0.25;
  all.forEach((x, k) => words.push({...x, s: all.length === 1 ? first : first + ((last - first) * k) / (all.length - 1)}));
  const hl = sc.hl.split(' ');
  const sweep = ((f % 120) / 120) * 260 - 80;
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: 1080, padding: '0 80px', boxSizing: 'border-box', textAlign: center ? 'center' : 'left'}}>
      {sc.title.map((_, li) => (
        <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: center ? 'center' : 'flex-start', gap: '0 26px'}}>
          {words.filter((x) => x.line === li).map((x, k) => {
            const lf = f - Math.round((x.s - t0 - 0.12) * fps);
            const p = sp(lf, 11, 170);
            const isHl = hl.includes(x.w);
            return (
              <span key={k} style={{display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: center ? 112 : 124, lineHeight: 1.08,
                letterSpacing: -2, opacity: ci(lf, [0, 5], [0, 1]),
                transform: `translateY(${(1 - p) * 70}px) scale(${interpolate(p, [0, 1], [1.35, 1])})`,
                ...(isHl
                  ? {backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${sweep - 10}%, rgba(255,255,255,.95) ${sweep}%, rgba(255,255,255,0) ${sweep + 10}%), ${GOLD}`,
                      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `blur(${(1 - Math.min(1, p)) * 10}px) drop-shadow(0 5px 0 #5A2E00) drop-shadow(0 0 22px rgba(255,190,60,.45))`}
                  : {color: 'white', filter: `blur(${(1 - Math.min(1, p)) * 10}px)`, textShadow: '0 6px 0 rgba(0,0,0,.35), 0 0 30px rgba(0,0,0,.4)'})}}>
                {x.w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{sc: LukaScene; t: number; center: boolean; y: number}> = ({sc, t, center, y}) => {
  const ws = sc.body;
  if (!ws.length) return null;
  const a = ci(t, [ws[0].s - 0.6, ws[0].s - 0.2], [0, 1]);
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: 1080, padding: '0 80px', boxSizing: 'border-box', opacity: a,
      transform: `translateY(${(1 - a) * 30}px)`, display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: center ? 'center' : 'flex-start'}}>
      {ws.map((w, k) => {
        const on = t >= w.s - 0.04;
        const now = on && t < w.e;
        const k2 = ci(t, [w.s - 0.04, w.s + 0.1], [0, 1]);
        return (
          <span key={k} style={{fontFamily: FONT, fontWeight: 700, fontSize: 54, lineHeight: 1.3, display: 'inline-block',
            color: now ? '#FFD45A' : on ? '#FFFFFF' : 'rgba(255,255,255,.32)',
            textShadow: now ? '0 0 22px rgba(255,200,70,.7)' : '0 3px 10px rgba(0,0,0,.5)',
            transform: `translateY(${now ? -4 * k2 : 0}px) scale(${now ? 1 + 0.06 * k2 : 1})`}}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

const BigNum: React.FC<{n: string; f: number}> = ({n, f}) => {
  const draw = ci(f, [0, 24], [1, 0]);
  const fill = ci(f, [16, 30], [0, 0.18]);
  return (
    <svg width={460} height={420} style={{position: 'absolute', left: 40, top: 70}}>
      <text x={40} y={360} fontFamily={FONT} fontWeight={900} fontSize={400} fill={`rgba(255,212,90,${fill})`} stroke={GC} strokeWidth={6}
        strokeDasharray={1800} strokeDashoffset={1800 * draw} style={{filter: 'drop-shadow(0 0 18px rgba(255,190,60,.45))'}}>
        {n}
      </text>
    </svg>
  );
};

const Kicker: React.FC<{text: string; f: number; center: boolean; y: number}> = ({text, f, center, y}) => {
  const sp = useSp();
  const p = sp(f - 3, 13, 180);
  const line = ci(f, [6, 26], [0, 1]);
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: 1080, padding: '0 80px', boxSizing: 'border-box', textAlign: center ? 'center' : 'left'}}>
      <span style={{display: 'inline-block', fontFamily: FONT, fontWeight: 800, fontSize: 36, letterSpacing: 8, color: '#0B1A33',
        background: GOLD, padding: '8px 22px', borderRadius: 40, opacity: p, transform: `translateX(${(1 - p) * -60}px)`,
        boxShadow: '0 0 26px rgba(255,190,60,.45)'}}>{text}</span>
      <div style={{height: 6, width: 220 * line, background: GOLD, borderRadius: 3, marginTop: 18, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0}} />
    </div>
  );
};

const Progress: React.FC<{t: number; scenes: LukaScene[]; dur: number}> = ({t, scenes, dur}) => {
  const p = Math.min(1, t / dur);
  const lukas = scenes.filter((s) => s.num);
  return (
    <div style={{position: 'absolute', top: 1790, left: 80, width: 920}}>
      <div style={{position: 'relative', height: 8, background: 'rgba(255,255,255,.15)', borderRadius: 4}}>
        <div style={{position: 'absolute', height: 8, width: `${p * 100}%`, background: GOLD, borderRadius: 4, boxShadow: '0 0 14px rgba(255,190,60,.7)'}} />
        {lukas.map((s) => {
          const on = t >= s.t;
          const x = (s.t / dur) * 920;
          return (
            <div key={s.num} style={{position: 'absolute', left: x - 20, top: -16, width: 40, height: 40, borderRadius: 20,
              background: on ? GOLD : NAVY, border: `3px solid ${GC}`, textAlign: 'center', lineHeight: '34px',
              fontFamily: FONT, fontWeight: 900, fontSize: 22, color: on ? NAVY : '#FFE9A0',
              transform: `scale(${on ? 1 + 0.25 * ci(t, [s.t, s.t + 0.15, s.t + 0.5], [0, 1, 0]) : 0.85})`}}>
              {s.num}
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 30, fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: 'rgba(255,233,160,.75)', textAlign: 'center'}}>
        KENALI LUKA UANG DALAM DIRI
      </div>
    </div>
  );
};

// ---------------- scene ----------------
const Scene: React.FC<{sc: LukaScene; i: number; t1: number; scenes: LukaScene[]}> = ({sc, i, t1}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const f = frame - Math.round(sc.t * fps);
  const dur = t1 - sc.t;
  const center = !sc.num;
  const out = i < 7 ? ci(t, [t1 - 0.3, t1], [0, 1]) : 0;
  const zoom = 1 + ci(f, [0, dur * fps], [0, 0.035]);
  const ty = center ? (i === 0 ? 300 : 340) : 600;
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${zoom + out * 0.06}) translateY(${-out * 60}px)`, filter: `blur(${out * 14}px)`}}>
      {sc.num ? <BigNum n={sc.num} f={f} /> : null}
      {sc.kicker ? <Kicker text={sc.kicker} f={f} center={center} y={center ? ty - 120 : 500} /> : null}
      <Title sc={sc} f={f} fps={fps} center={center} y={ty} />
      <Body sc={sc} t={t} center={center} y={center ? ty + sc.title.length * 124 + 60 : 920} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="luGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF6C8" />
            <stop offset=".4" stopColor="#FFD45A" />
            <stop offset=".75" stopColor="#F2B023" />
            <stop offset="1" stopColor="#B86A00" />
          </linearGradient>
        </defs>
        <Illus i={i} f={f} dur={dur} />
        {f < 40 ? <Sparks f={f} seed={'s' + i} cx={center ? 540 : 260} cy={center ? ty + 80 : 400} n={26} spread={340} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

// light streak + soft flash on each scene change
const Transition: React.FC<{t: number; scenes: LukaScene[]}> = ({t, scenes}) => {
  const near = scenes.map((s) => t - s.t).filter((d) => d > -0.15 && d < 0.6)[0];
  if (near === undefined || t < 0.3) return null;
  const x = ci(near, [-0.15, 0.5], [-600, 1500]);
  const flash = ci(near, [-0.1, 0, 0.3], [0, 0.22, 0]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#FFE7A8', opacity: flash}} />
      <div style={{position: 'absolute', left: x, top: -300, width: 220, height: 2600, transform: 'rotate(18deg)',
        background: 'linear-gradient(90deg, rgba(255,230,160,0), rgba(255,236,180,.55), rgba(255,230,160,0))'}} />
    </AbsoluteFill>
  );
};

export const LukaUang: React.FC<LukaUangProps> = ({audio, duration, scenes}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let si = 0;
  scenes.forEach((s, i) => {
    if (t >= s.t) si = i;
  });
  const fadeOut = ci(t, [duration - 0.6, duration], [1, 0]);
  return (
    <AbsoluteFill style={{backgroundColor: '#040A16', overflow: 'hidden'}}>
      <Background f={frame} scene={si} />
      <AbsoluteFill style={{opacity: fadeOut}}>
        {scenes.map((sc, i) => {
          const t1 = i + 1 < scenes.length ? scenes[i + 1].t : duration;
          if (t < sc.t - 0.02 || t > t1 + 0.02) return null;
          return <Scene key={i} sc={sc} i={i} t1={t1} scenes={scenes} />;
        })}
        <Transition t={t} scenes={scenes} />
        <Progress t={t} scenes={scenes} dur={duration} />
      </AbsoluteFill>
      {audio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
