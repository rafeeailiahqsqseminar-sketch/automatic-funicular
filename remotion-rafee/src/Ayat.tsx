import React from 'react';
import {AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp} from './Mukadimah';
import {Captions, Word} from './Captions';

// "Keajaiban Al-Quran & Sains" siri 3 video (tanpa footage): hook -> ayat (Arab + terjemahan) -> ilustrasi + 4 kad -> end card.
// Amiri (Arabic subset) served from public/fonts: the render browser cannot reach Google Fonts here.
const AMIRI = 'Amiri Local';
if (typeof window !== 'undefined' && 'FontFace' in window) {
  const h = delayRender('Amiri');
  Promise.all((['400', '700'] as const).map((w) => new FontFace(AMIRI, `url(${staticFile(`fonts/Amiri-${w}-arabic.woff2`)})`, {weight: w}).load()))
    .then((fs) => {
      fs.forEach((x) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(x));
      continueRender(h);
    })
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
}

export type Point = {top: string; title: string[]; hl?: string; note: string};
export type AyatProps = {
  part: string;
  hookTop: string;
  hook: string[];
  hl: string;
  hookSub: string;
  arab: string;
  surah: string;
  surah2?: string;
  terjemahan: string;
  anim: 'otak' | 'janin' | 'sulbi';
  points: Point[];
  endLine: string;
  // optional voice-over sync (seconds): when given, scenes follow the VO instead of the fixed timing
  timing?: Timing;
  words?: Word[];
  audio?: string;
};
export type Timing = {ayat: number; points: number[]; end: number; total: number; tr0?: number; tr1?: number};

export const FPS = 30;
export const T_AYAT = 5.2;
export const T_POINTS = 17.5;
export const POINT_D = 7.2;
export const endT = (n: number) => T_POINTS + n * POINT_D;
export const ayatDuration = (n: number) => endT(n) + 7.5;
const timingOf = (p: AyatProps): Timing =>
  p.timing ?? {ayat: T_AYAT, points: p.points.map((_, i) => T_POINTS + i * POINT_D), end: endT(p.points.length), total: ayatDuration(p.points.length)};

const GOLD = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#B86A00 100%)';
const EMERALD = '#34D399';
const ease = Easing.out(Easing.cubic);
const sp = (f: number, fps: number, d = 13, s = 150) => spring({frame: f, fps, config: {damping: d, stiffness: s}});
const goldText = (fs: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'Inter Display', fontWeight: 900, fontSize: fs, lineHeight: 1.02, backgroundImage: GOLD,
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 5px 0 #4A2600)', ...extra,
});

// ---------- background: deep emerald-navy, slow 8-point star lattice, drifting light motes ----------
const Star8: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
  const pts = new Array(16).fill(0).map((_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.62 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  });
  return <polygon points={pts.join(' ')} fill="none" stroke="rgba(255,212,90,.11)" strokeWidth={2} />;
};
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = (frame * 0.25) % 180;
  const stars: React.ReactNode[] = [];
  for (let r = -1; r < 13; r++) for (let c = -1; c < 8; c++) stars.push(<Star8 key={`${r}-${c}`} x={c * 180 + (r % 2) * 90} y={r * 160 + drift} r={70} />);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #0E3B3A 0%, #06202A 45%, #030B14 100%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>{stars}</svg>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {new Array(46).fill(0).map((_, i) => {
          const x = random('mx' + i) * 1080;
          const y = (random('my' + i) * 1920 - frame * (0.4 + random('ms' + i)) + 19200) % 1920;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (14 + random('mt' + i) * 20) + i));
          return <circle key={i} cx={x} cy={y} r={1.2 + random('mr' + i) * 2.4} fill="#FFE9A0" opacity={0.45 * tw} />;
        })}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

const Badge: React.FC<{part: string; o: number}> = ({part, o}) => (
  <div style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 30, letterSpacing: 6, color: EMERALD,
    padding: '7px 22px', border: `2px solid ${EMERALD}`, borderRadius: 30, background: 'rgba(2,14,18,.6)', opacity: o,
    boxShadow: '0 0 18px rgba(52,211,153,.45)'}}>KEAJAIBAN AL-QURAN · {part}</div>
);

// ---------- scene 1: hook ----------
const Hook: React.FC<{p: AyatProps; f: number; fps: number}> = ({p, f, fps}) => {
  const tm = timingOf(p);
  const out = interpolate(f, [tm.ayat * fps - 10, tm.ayat * fps], [0, 1], clamp);
  const a = sp(f - 2, fps);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - out, filter: `blur(${out * 12}px)`}}>
      <div style={{textAlign: 'center', marginTop: -160}}>
        <Badge part={p.part} o={a} />
        <div style={{marginTop: 46, fontFamily: 'Inter Display', fontWeight: 800, fontSize: p.hookTop.length > 24 ? 40 : 52, letterSpacing: 4, color: '#FFE9A0',
          opacity: a, transform: `translateY(${(1 - a) * -30}px)`}}>{p.hookTop}</div>
        <div style={{marginTop: 22}}>
          {p.hook.map((line, li) => (
            <div key={li} style={{display: 'flex', justifyContent: 'center', gap: 24, marginTop: 10, flexWrap: 'wrap', padding: '0 40px'}}>
              {line.split(' ').map((w, wi) => {
                const k = sp(f - 10 - li * 8 - wi * 4, fps, 11, 160);
                const isHl = w.replace(/[^\p{L}'-]/gu, '') === p.hl.replace(/[^\p{L}'-]/gu, '');
                return (
                  <span key={wi} style={{position: 'relative', display: 'inline-block', opacity: k,
                    transform: `translateY(${(1 - k) * 70}px) scale(${interpolate(k, [0, 1], [1.35, 1])})`}}>
                    {isHl ? <span style={{position: 'absolute', inset: '-4px -16px', background: '#0F9F6E', borderRadius: 18,
                      transform: `scaleX(${sp(f - 30, fps)})`, boxShadow: '0 0 30px rgba(52,211,153,.6)'}} /> : null}
                    <span style={{position: 'relative', ...(isHl ? {fontFamily: 'Inter Display', fontWeight: 900, fontSize: 118, color: 'white',
                      textShadow: '0 5px 0 #064E3B'} : goldText(118))}}>{w}</span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{marginTop: 44, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 46, color: 'white', opacity: sp(f - 40, fps),
          textShadow: '0 2px 12px rgba(0,0,0,.9)'}}>{p.hookSub}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- scene 2: ayat ----------
const AyatCard: React.FC<{p: AyatProps; f: number; fps: number}> = ({p, f, fps}) => {
  const k = sp(f, fps, 14);
  const tm = timingOf(p);
  const out = interpolate(f, [(tm.points[0] - tm.ayat) * fps - 10, (tm.points[0] - tm.ayat) * fps], [0, 1], clamp);
  const arabO = interpolate(f, [8, 40], [0, 1], clamp);
  const t0 = (tm.tr0 !== undefined ? tm.tr0 - tm.ayat : 2.6) * fps;
  const t1 = tm.tr1 !== undefined ? (tm.tr1 - tm.ayat) * fps : t0 + p.terjemahan.length * 0.85;
  const chars = Math.floor(interpolate(f, [t0, t1], [0, p.terjemahan.length], clamp));
  const shine = ((f % 120) / 120) * 260 - 80;
  return (
    <AbsoluteFill style={{alignItems: 'center', opacity: 1 - out, filter: `blur(${out * 10}px)`}}>
      <div style={{position: 'absolute', top: 360, left: 70, width: 940, borderRadius: 44, padding: '54px 46px 50px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(16,70,64,.92), rgba(3,16,24,.94))', border: '3px solid rgba(255,200,70,.9)',
        boxShadow: '0 0 60px rgba(255,170,30,.35)', textAlign: 'center', opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.88, 1])})`}}>
        <div style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 30, letterSpacing: 7, color: EMERALD}}>FIRMAN ALLAH SWT</div>
        <div style={{marginTop: 30, direction: 'rtl', fontFamily: AMIRI, fontWeight: 700, fontSize: 76, lineHeight: 1.75, opacity: arabO,
          backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${shine - 10}%, rgba(255,255,255,.9) ${shine}%, rgba(255,255,255,0) ${shine + 10}%), ${GOLD}`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 3px 0 #3A1E00)',
          transform: `translateY(${(1 - arabO) * 20}px)`}}>{p.arab}</div>
        <div style={{margin: '26px auto 0', width: 520, height: 3, background: 'linear-gradient(90deg, transparent, #FFD45A, transparent)'}} />
        <div style={{marginTop: 22, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 40, color: '#FFE9A0', opacity: arabO}}>{p.surah}</div>
        {p.surah2 ? <div style={{marginTop: 6, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 32, color: 'rgba(255,255,255,.75)', opacity: arabO}}>{p.surah2}</div> : null}
        <div style={{marginTop: 30, minHeight: 300, fontFamily: 'Inter Display', fontWeight: 600, fontStyle: 'italic', fontSize: 44, lineHeight: 1.35,
          color: 'white', textShadow: '0 2px 10px rgba(0,0,0,.8)'}}>
          {p.terjemahan.slice(0, chars)}
          <span style={{opacity: chars < p.terjemahan.length ? 1 : 0}}>▍</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- illustrations (SVG, 1080 x 820, shown from T_POINTS) ----------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="ayGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFF6C8" />
      <stop offset=".4" stopColor="#FFD45A" />
      <stop offset=".75" stopColor="#F2B023" />
      <stop offset="1" stopColor="#B86A00" />
    </linearGradient>
    <radialGradient id="ayGlow">
      <stop offset="0" stopColor="rgba(255,226,140,.95)" />
      <stop offset=".5" stopColor="rgba(255,200,90,.35)" />
      <stop offset="1" stopColor="rgba(255,200,90,0)" />
    </radialGradient>
    <radialGradient id="ayHot">
      <stop offset="0" stopColor="#FFF7B0" />
      <stop offset=".35" stopColor="#FFB020" />
      <stop offset=".7" stopColor="rgba(232,49,42,.7)" />
      <stop offset="1" stopColor="rgba(232,49,42,0)" />
    </radialGradient>
    <radialGradient id="ayWomb" cx=".5" cy=".45" r=".6">
      <stop offset="0" stopColor="rgba(255,150,140,.35)" />
      <stop offset=".8" stopColor="rgba(190,60,80,.25)" />
      <stop offset="1" stopColor="rgba(190,60,80,.05)" />
    </radialGradient>
    <filter id="ayBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const Label: React.FC<{x: number; y: number; text: string; o: number; color?: string; fs?: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, o, color = '#FFE9A0', fs = 34, anchor = 'middle'}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily="Inter Display" fontWeight={900} fontSize={fs} fill={color} opacity={o}
    stroke="#02131A" strokeWidth={7} paintOrder="stroke" letterSpacing={2}>{text}</text>
);

// 1) side-view head facing right; brain inside; frontal lobe (front, behind the forehead) lights up
const HEAD = 'M360,700 C350,640 300,600 300,470 C300,300 420,190 575,190 C700,190 790,265 805,370 C808,395 812,410 826,440 L858,505 C864,518 854,526 840,528 L832,530 C838,548 836,560 828,566 C836,578 832,594 820,600 C826,640 790,655 750,650 L730,648 L730,730';
const BRAIN = 'M360,440 C345,350 410,260 520,248 C600,236 700,250 752,322 C790,372 790,440 760,478 C730,520 660,520 610,540 C560,560 470,560 420,530 C380,508 365,480 360,440 Z';
const Otak: React.FC<{f: number; fps: number; st: number; sf: number}> = ({f, fps, st, sf}) => {
  const k = sp(f, fps, 14);
  const draw = interpolate(f, [0, 40], [1, 0], clamp);
  const pulse = 0.65 + 0.35 * Math.sin(f / 7);
  const front = st >= 0 ? interpolate(f, [12, 34], [0, 1], clamp) : 0;
  const pre = st >= 1 ? sp(sf, fps) : 0;
  return (
    <g opacity={k}>
      <clipPath id="frontClip"><rect x={630} y={200} width={300} height={400} /></clipPath>
      <clipPath id="preClip"><rect x={690} y={300} width={200} height={220} /></clipPath>
      <path d={HEAD} fill="rgba(255,233,190,.07)" stroke="url(#ayGold)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={2600} strokeDashoffset={2600 * draw} filter="url(#ayBlur)" />
      <path d={BRAIN} fill="rgba(244,170,190,.22)" stroke="#F7B6C8" strokeWidth={4} />
      {/* gyri */}
      {['M400,400 C430,360 470,380 480,340', 'M440,480 C480,450 520,490 560,450', 'M520,300 C540,340 580,320 600,360', 'M560,420 C600,400 610,450 650,430',
        'M420,320 C450,300 480,320 500,290', 'M600,500 C630,470 670,500 700,470', 'M640,300 C660,330 700,320 710,350', 'M680,400 C710,380 730,420 750,400'].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#F7B6C8" strokeWidth={3.5} strokeLinecap="round" opacity={0.8} />
      ))}
      {/* frontal lobe */}
      <g clipPath="url(#frontClip)" opacity={front}>
        <path d={BRAIN} fill="url(#ayGold)" opacity={0.55 + 0.25 * pulse} />
        <path d={BRAIN} fill="none" stroke="#FFF6C8" strokeWidth={5} filter="url(#ayBlur)" />
      </g>
      <line x1={630} x2={630} y1={250} y2={545} stroke="#FFF6C8" strokeWidth={3} strokeDasharray="10 8" opacity={front * 0.8} />
      {/* prefrontal cortex: hot spot right behind the forehead */}
      <g clipPath="url(#preClip)" opacity={pre}>
        <circle cx={760} cy={400} r={110 * (0.9 + 0.1 * pulse)} fill="url(#ayHot)" />
      </g>
      {/* nasiyah arrow at the forehead */}
      <g opacity={front} transform={`translate(${interpolate(front, [0, 1], [60, 0])},0)`}>
        <path d="M985,300 L870,330" stroke="#FFD45A" strokeWidth={7} strokeLinecap="round" />
        <path d="M870,330 L898,308 M870,330 L900,344" stroke="#FFD45A" strokeWidth={7} strokeLinecap="round" />
        <Label x={1000} y={270} text="NASIYAH" o={1} anchor="end" fs={36} />
      </g>
      <Label x={520} y={160} text="LOBUS FRONTAL" o={front} fs={44} />
      <g opacity={pre}>
        <line x1={760} y1={420} x2={850} y2={600} stroke="#FFB020" strokeWidth={4} />
        <circle cx={760} cy={420} r={8} fill="#FFF7B0" />
        <Label x={880} y={640} text="PREFRONTAL CORTEX" o={1} color="#FFB020" fs={34} />
      </g>
      {/* stage 2: decision / lie signals ripple out; stage 3: activity scan */}
      {st >= 2 ? [0, 1, 2].map((i) => {
        const q = ((sf + i * 18) % 54) / 54;
        return <circle key={i} cx={760} cy={400} r={60 + q * 220} fill="none" stroke="#FFD45A" strokeWidth={5 * (1 - q)} opacity={(1 - q) * 0.9} />;
      }) : null}
      {st >= 3 ? (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={250 + i * 30} y={760 - 40 - 60 * Math.abs(Math.sin(sf / 6 + i))} width={20} height={40 + 60 * Math.abs(Math.sin(sf / 6 + i))} rx={5}
              fill={i % 2 ? '#FFB020' : '#E8312A'} opacity={sp(sf, fps)} />
          ))}
          <Label x={470} y={750} text="AKTIF!" o={sp(sf - 6, fps)} color="#FF6A4D" fs={46} anchor="start" />
        </g>
      ) : null}
    </g>
  );
};

// 2) fetus in the womb: ear lights up first (2nd trimester, sound waves), eye stays closed until birth
const Janin: React.FC<{f: number; fps: number; st: number; sf: number}> = ({f, fps, st, sf}) => {
  const k = sp(f, fps, 14);
  const bob = Math.sin(f / 22) * 6;
  const ear = st >= 1 ? sp(sf, fps) : st >= 0 ? 0.0 : 0;
  const waves = st >= 2;
  const eyeO = st >= 3 ? sp(sf, fps) : 0;
  // timeline progress: T1 .. T2 (ear) .. T3 .. LAHIR (eye)
  const tlx0 = 150;
  const tlx1 = 930;
  const prog = st >= 3 ? interpolate(sf, [0, 60], [0.42, 1], {...clamp, easing: ease}) : st >= 1 ? interpolate(sf, [0, 40], [0, 0.42], {...clamp, easing: ease}) : 0;
  const order = st === 0 ? sp(sf, fps) : st > 0 ? 1 : 0;
  return (
    <g opacity={k}>
      {/* order chips: as-sam' then al-absar */}
      <g opacity={order} transform={`translate(0,${(1 - order) * -30})`}>
        <rect x={140} y={20} width={340} height={92} rx={46} fill="rgba(15,159,110,.9)" stroke="#FFD45A" strokeWidth={3} />
        <text x={310} y={80} textAnchor="middle" fontFamily={AMIRI} fontWeight={700} fontSize={52} fill="white">السَّمْع</text>
        <text x={540} y={80} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={56} fill="#FFD45A">→</text>
        <rect x={600} y={20} width={340} height={92} rx={46} fill="rgba(3,16,24,.85)" stroke="rgba(255,255,255,.5)" strokeWidth={3} />
        <text x={770} y={80} textAnchor="middle" fontFamily={AMIRI} fontWeight={700} fontSize={52} fill="white">الأَبْصَار</text>
        <Label x={310} y={150} text="1 · PENDENGARAN" o={1} fs={28} />
        <Label x={770} y={150} text="2 · PENGLIHATAN" o={1} fs={28} color="rgba(255,255,255,.85)" />
      </g>
      {/* womb */}
      <g transform={`translate(0,${bob})`}>
        <ellipse cx={540} cy={420} rx={250} ry={225} fill="url(#ayWomb)" stroke="#F7B6C8" strokeWidth={5} />
        {/* umbilical cord */}
        <path d="M520,470 C470,560 560,600 560,640" fill="none" stroke="#F7B6C8" strokeWidth={9} strokeLinecap="round" opacity={0.8} />
        {/* curled fetus: body, legs, arm, head */}
        <path d="M500,330 C420,350 390,440 420,510 C450,580 560,600 620,560 C660,530 650,470 610,450 C580,435 540,450 530,480" fill="rgba(255,214,196,.9)" stroke="#E8A08C" strokeWidth={5} strokeLinejoin="round" />
        <path d="M600,555 C640,580 660,540 640,515" fill="rgba(255,214,196,.95)" stroke="#E8A08C" strokeWidth={5} />
        <path d="M540,420 C570,440 590,470 570,490" fill="none" stroke="#E8A08C" strokeWidth={6} strokeLinecap="round" />
        <circle cx={555} cy={318} r={96} fill="rgba(255,214,196,.95)" stroke="#E8A08C" strokeWidth={5} />
        {/* closed eye */}
        <path d="M600,300 Q618,312 636,300" fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" />
        {/* ear */}
        <path d="M528,310 C512,300 512,340 528,345 C540,348 545,330 538,322" fill="none" stroke={ear > 0 ? '#FFD45A' : '#C98572'} strokeWidth={7} strokeLinecap="round" filter={ear > 0 ? 'url(#ayBlur)' : undefined} />
        {ear > 0 ? <circle cx={528} cy={325} r={70 * ear} fill="url(#ayGlow)" opacity={0.8} /> : null}
        {/* sound waves from outside the womb (right) towards the ear */}
        {waves ? [0, 1, 2, 3].map((i) => {
          const q = ((sf + i * 12) % 48) / 48;
          const x = 900 - q * 300;
          return <path key={i} d={`M${x},250 Q${x - 40},325 ${x},400`} fill="none" stroke="#FFD45A" strokeWidth={6} strokeLinecap="round" opacity={Math.sin(q * Math.PI) * 0.95} />;
        }) : null}
        {waves ? <Label x={950} y={230} text="♪ BUNYI LUAR" o={sp(sf, fps)} anchor="end" fs={30} /> : null}
        {/* eye: still closed */}
        <g opacity={eyeO}>
          <circle cx={618} cy={300} r={34} fill="none" stroke="#E8312A" strokeWidth={5} />
          <line x1={650} y1={278} x2={790} y2={200} stroke="#E8312A" strokeWidth={4} />
          <Label x={800} y={190} text="MATA TERTUTUP" o={1} color="#FF8A7A" fs={30} anchor="start" />
        </g>
      </g>
      {/* timeline */}
      <g opacity={st >= 1 ? 1 : 0}>
        <line x1={tlx0} x2={tlx1} y1={730} y2={730} stroke="rgba(255,255,255,.25)" strokeWidth={8} strokeLinecap="round" />
        <line x1={tlx0} x2={tlx0 + (tlx1 - tlx0) * prog} y1={730} y2={730} stroke="url(#ayGold)" strokeWidth={8} strokeLinecap="round" />
        {[['T1', 0], ['T2', 0.42], ['T3', 0.7], ['LAHIR', 1]].map(([l, p]) => {
          const x = tlx0 + (tlx1 - tlx0) * (p as number);
          return (
            <g key={l as string}>
              <circle cx={x} cy={730} r={prog >= (p as number) - 0.001 ? 14 : 9} fill={prog >= (p as number) - 0.001 ? '#FFD45A' : 'rgba(255,255,255,.4)'} />
              <Label x={x} y={790} text={l as string} o={1} fs={28} color="rgba(255,255,255,.9)" />
            </g>
          );
        })}
        <Label x={tlx0 + (tlx1 - tlx0) * 0.42} y={700} text="👂 DENGAR" o={1} fs={30} />
        <Label x={tlx1} y={700} text="👁 LIHAT" o={st >= 3 ? interpolate(sf, [40, 60], [0, 1], clamp) : 0} fs={30} anchor="end" />
      </g>
    </g>
  );
};

// 3) torso side view (facing right): spine (sulbi) at the back, ribs + sternum (tara'ib) in front; gonad starts between them, then descends
const Sulbi: React.FC<{f: number; fps: number; st: number; sf: number}> = ({f, fps, st, sf}) => {
  const k = sp(f, fps, 14);
  const lab = st >= 0 ? interpolate(f, [10, 30], [0, 1], clamp) : 0;
  const vert = new Array(15).fill(0).map((_, i) => {
    const y = 120 + i * 40;
    const x = 360 + 22 * Math.sin((i / 14) * Math.PI * 1.3);
    return {x, y};
  });
  const gonad = st >= 1 ? sp(sf, fps) : 0;
  const aorta = st >= 2 ? interpolate(sf, [0, 30], [0, 1], clamp) : st > 2 ? 1 : 0;
  const desc = st >= 3 ? interpolate(sf, [10, 110], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 0;
  const gy = 400 + desc * 300;
  const gx = 500 + desc * 60;
  const pulse = 0.7 + 0.3 * Math.sin(f / 6);
  return (
    <g opacity={k}>
      {/* body outline */}
      <path d="M330,90 C300,250 300,520 330,640 C350,720 360,760 380,800 M760,90 C800,200 805,330 780,430 C760,520 720,600 720,700 C720,740 710,780 700,800"
        fill="none" stroke="rgba(255,233,190,.35)" strokeWidth={5} strokeLinecap="round" />
      {/* ribs: from spine to sternum */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const v = vert[i + 1];
        const sy = 170 + i * 34;
        return <path key={i} d={`M${v.x + 20},${v.y} C${520},${v.y + 30 + i * 6} ${650},${sy + 40} ${720},${sy + 20}`} fill="none"
          stroke="url(#ayGold)" strokeWidth={7} strokeLinecap="round" opacity={0.75} />;
      })}
      {/* sternum */}
      <rect x={714} y={150} width={26} height={270} rx={12} fill="url(#ayGold)" stroke="#3C1C00" strokeWidth={3} />
      {/* spine */}
      {vert.map((v, i) => <rect key={i} x={v.x - 26} y={v.y - 16} width={52} height={32} rx={9} fill="#F4E6C8" stroke="#8A6A3A" strokeWidth={3} />)}
      {/* aorta along the spine + branch to the gonad */}
      <path d={`M${400},110 C410,300 415,500 410,760`} fill="none" stroke="#E8312A" strokeWidth={12} strokeLinecap="round"
        strokeDasharray={700} strokeDashoffset={700 * (1 - aorta)} opacity={0.9} />
      <path d="M412,400 C440,395 470,398 495,400" fill="none" stroke="#E8312A" strokeWidth={7} strokeLinecap="round" opacity={aorta} />
      {aorta > 0 ? <Label x={300} y={620} text="ARTERI UTAMA" o={aorta} color="#FF8A7A" fs={28} anchor="end" /> : null}
      {/* descent path */}
      <path d="M500,400 C510,520 540,620 560,700" fill="none" stroke="#FFE9A0" strokeWidth={4} strokeDasharray="10 12" opacity={st >= 3 ? 0.8 : 0} />
      {/* gonad */}
      {gonad > 0 ? (
        <g>
          <circle cx={gx} cy={gy} r={80 * pulse} fill="url(#ayGlow)" />
          <ellipse cx={gx} cy={gy} rx={30 * gonad} ry={22 * gonad} fill="#FFD45A" stroke="#7A3B00" strokeWidth={4} />
          <Label x={gx + 50} y={gy + 70} text={desc > 0.95 ? 'KEDUDUKAN KEKAL' : 'TESTIS / OVARI'} o={gonad} fs={30} anchor="start" />
        </g>
      ) : null}
      {/* labels */}
      <g opacity={lab}>
        <Label x={250} y={80} text="SULBI" o={1} fs={48} />
        <Label x={250} y={120} text="tulang belakang" o={1} fs={26} color="rgba(255,255,255,.85)" />
        <Label x={860} y={210} text="TARA'IB" o={1} fs={48} />
        <Label x={860} y={250} text="tulang dada" o={1} fs={26} color="rgba(255,255,255,.85)" />
        <path d="M300,140 L340,180" stroke="#FFE9A0" strokeWidth={4} />
        <path d="M800,260 L748,290" stroke="#FFE9A0" strokeWidth={4} />
      </g>
    </g>
  );
};

const PointCard: React.FC<{pt: Point; f: number; fps: number; idx: number; n: number; dur: number; hideNote?: boolean}> = ({pt, f, fps, idx, n, dur, hideNote}) => {
  const k = sp(f, fps, 13, 160);
  const out = interpolate(f, [dur * fps - 8, dur * fps], [0, 1], clamp);
  const chars = Math.floor(interpolate(f, [14, 14 + pt.note.length * 0.9], [0, pt.note.length], clamp));
  const hl = pt.hl ?? pt.title[pt.title.length - 1].split(' ').pop();
  return (
    <div style={{position: 'absolute', top: hideNote ? 1170 : 1230, width: 1080, textAlign: 'center', opacity: k * (1 - out),
      filter: `blur(${(1 - k) * 12 + out * 10}px)`, transform: `translateY(${(1 - k) * 50 - out * 30}px)`}}>
      <div style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 34, letterSpacing: 6, color: '#FFE9A0'}}>
        <span style={{color: EMERALD}}>{String(idx + 1).padStart(2, '0')}/{String(n).padStart(2, '0')}</span>  {pt.top}
      </div>
      <div style={{marginTop: 12}}>
        {pt.title.map((line, li) => (
          <div key={li} style={{display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap', padding: '0 40px'}}>
            {line.split(' ').map((w, wi) => {
              const q = sp(f - 4 - li * 6 - wi * 3, fps, 11, 170);
              const isHl = w === hl;
              const fs = line.length > 14 ? 92 : 108;
              return (
                <span key={wi} style={{position: 'relative', display: 'inline-block', marginTop: 6, opacity: q, transform: `scale(${interpolate(q, [0, 1], [1.3, 1])})`}}>
                  {isHl ? <span style={{position: 'absolute', inset: '0 -14px', background: '#0F9F6E', borderRadius: 16, transform: `scaleX(${sp(f - 16, fps)})`}} /> : null}
                  <span style={{position: 'relative', ...(isHl ? {fontFamily: 'Inter Display', fontWeight: 900, fontSize: fs, lineHeight: 1.08, color: 'white',
                    textShadow: '0 5px 0 #064E3B'} : goldText(fs))}}>{w}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{marginTop: 22, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 44, lineHeight: 1.3, color: 'white', minHeight: 120,
        textShadow: '0 2px 12px rgba(0,0,0,.9)', padding: '0 70px'}}>{hideNote ? null : pt.note.slice(0, chars)}</div>
    </div>
  );
};

const Header: React.FC<{p: AyatProps; f: number; fps: number}> = ({p, f, fps}) => {
  const k = sp(f, fps);
  return (
    <div style={{position: 'absolute', top: 110, width: 1080, textAlign: 'center', opacity: k}}>
      <Badge part={p.part} o={1} />
      <div style={{marginTop: 14, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 40, color: 'white', letterSpacing: 2,
        textShadow: '0 2px 10px rgba(0,0,0,.8)'}}>{p.surah}</div>
    </div>
  );
};

const EndCard: React.FC<{p: AyatProps; f: number; fps: number}> = ({p, f, fps}) => {
  const k = sp(f, fps, 13);
  const k2 = sp(f - 24, fps, 12);
  const k3 = sp(f - 40, fps, 10, 160);
  const shine = ((f % 120) / 120) * 260 - 80;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center', marginTop: -140}}>
        <div style={{opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.8, 1])})`, direction: 'rtl', fontFamily: AMIRI, fontWeight: 700, fontSize: 150,
          lineHeight: 1.5, backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${shine - 10}%, rgba(255,255,255,.9) ${shine}%, rgba(255,255,255,0) ${shine + 10}%), ${GOLD}`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 5px 0 #3A1E00) drop-shadow(0 0 30px rgba(255,200,80,.45))'}}>سُبْحَانَ اللّٰه</div>
        <div style={{marginTop: 10, fontFamily: 'Inter Display', fontWeight: 700, fontSize: 46, color: 'white', padding: '0 80px', lineHeight: 1.3,
          opacity: k2, textShadow: '0 2px 12px rgba(0,0,0,.9)'}}>{p.endLine}</div>
        <div style={{margin: '60px auto 0', width: 840, borderRadius: 40, padding: '40px 0 46px', opacity: k3, transform: `scale(${interpolate(k3, [0, 1], [0.85, 1])})`,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(16,70,64,.92), rgba(3,16,24,.94))', border: '3px solid rgba(255,200,70,.95)',
          boxShadow: '0 0 50px rgba(255,170,30,.45)'}}>
          <div style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 36, letterSpacing: 6, color: '#FFE9A0'}}>BERGABUNG BERSAMA</div>
          <div style={{marginTop: 10, ...goldText(100)}}>KOMUNITI KAMI</div>
          <div style={{marginTop: 30, display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 60, color: 'white',
            background: '#E8312A', borderRadius: 18, padding: '6px 28px', boxShadow: '0 0 30px #E8312A', transform: `scale(${sp(f - 52, fps, 9, 180)})`}}>KLIK LINK BIO</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ayat: React.FC<AyatProps & {cover?: boolean}> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tm = timingOf(p);
  const fA = Math.round(tm.ayat * fps);
  const fP = Math.round(tm.points[0] * fps);
  const fE = Math.round(tm.end * fps);
  const pf = frame - fP;
  let st = -1;
  tm.points.forEach((t, i) => {
    if (frame >= Math.round(t * fps)) st = i;
  });
  const sf = frame - Math.round(tm.points[Math.max(0, st)] * fps);
  const dur = (st + 1 < tm.points.length ? tm.points[st + 1] : tm.end) - tm.points[Math.max(0, st)];
  const illusOut = interpolate(frame, [fE - 10, fE], [0, 1], clamp);
  const Il = p.anim === 'otak' ? Otak : p.anim === 'janin' ? Janin : Sulbi;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background frame={frame} />
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
      {frame < fA ? <Hook p={p} f={frame} fps={fps} /> : null}
      {frame >= fA && frame < fP ? <AyatCard p={p} f={frame - fA} fps={fps} /> : null}
      {frame >= fP && frame < fE ? (
        <>
          <Header p={p} f={pf} fps={fps} />
          <svg width={1080} height={820} style={{position: 'absolute', top: 360, opacity: 1 - illusOut, filter: `blur(${illusOut * 10}px)`}}>
            <Defs />
            <Il f={pf} fps={fps} st={st} sf={sf} />
          </svg>
          <PointCard key={st} pt={p.points[st]} f={sf} fps={fps} idx={st} n={p.points.length} dur={dur} hideNote={!!p.words} />
          {p.words ? <Captions words={p.words.filter((w) => w.s >= tm.points[0] - 0.3 && w.s < tm.end - 0.2)} y={1600} /> : null}
        </>
      ) : null}
      {frame >= fE ? <EndCard p={p} f={frame - fE} fps={fps} /> : null}
    </AbsoluteFill>
  );
};
