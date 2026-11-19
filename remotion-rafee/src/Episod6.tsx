import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {continueRender, delayRender} from 'remotion';
import data from './data/ep6.json';

// Fonts are served locally (public/ep6_*.woff2): the render browser cannot reach Google Fonts through the proxy here.
const SERIF = 'Ep6Cormorant';
const ARAB = 'Ep6Amiri';
const CAPS = 'Ep6Cinzel';
const FONTS: [string, string, string, string][] = [
  [SERIF, 'ep6_corm.woff2', 'normal', '300 700'],
  [SERIF, 'ep6_corm_i.woff2', 'italic', '300 700'],
  [ARAB, 'ep6_amiri.woff2', 'normal', '400'],
  [CAPS, 'ep6_cinzel.woff2', 'normal', '400 900'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('ep6 fonts');
  Promise.all(FONTS.map(([fam, file, style, weight]) => {
    const f = new FontFace(fam, `url(${staticFile(file)}) format('woff2')`, {style, weight});
    (document.fonts as unknown as Set<FontFace>).add(f);
    return f.load();
  })).then(() => continueRender(h)).catch((e) => { console.error(e); continueRender(h); });
}

const GOLD = '#E9C46A';
const GOLD_D = '#B8892E';
const W = 1080;
const H = 1920;
export const EP6_DURATION = 179; // seconds (VO 174.2 s + music tail)

type Cue = {text: string; words: [string, number][]; t: number; end: number};
const cues = data.cues as Cue[];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const ramp = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: ease});
const win = (t: number, a: number, b: number, d = 0.6) => Math.min(ramp(t, a - d / 2, d), 1 - ramp(t, b - d / 2, d));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------- highlight words (gold italic), by cue index ----------
const HL: Record<number, string[]> = {
  1: ['misteri'], 2: ['pertama'], 3: ['terakhir'], 4: ['anehnya'], 5: ['mengingati'], 6: ['terakhir'], 7: ['antara'],
  8: ['berharga'], 9: ['kehidupan'], 10: ['renungkan'], 11: ['dilahirkan'], 12: ['rahim', 'ibu'], 13: ['dunia'], 14: ['menanti'],
  15: ['perjalanan'], 16: ['dilahirkan'], 17: ['wajah'], 18: ['suara'], 19: ['kasih', 'sayang'], 20: ['kehidupan'], 21: ['dewasa'],
  22: ['aneh'], 23: ['mengejar'], 24: ['kekayaan'], 25: ['pengiktirafan'], 26: ['kedudukan'], 27: ['penerimaan'], 28: ['kadangkala'],
  29: ['sibuk'], 30: ['terlupa', 'mengapa'], 31: ['episod'], 32: ['alquran'], 33: ['dikembalikan'], 34: ['mati'], 35: ['dikembalikan'],
  36: ['fikirkan'], 37: ['kembali'], 38: ['pengalaman'], 39: ['cinta'], 40: ['kehilangan'], 41: ['kesedihan'], 42: ['melepaskan'],
  43: ['sebalik'], 44: ['mendalam'], 45: ['sekadar'], 46: ['datang'], 48: ['pergi'], 50: ['siapakah', 'diri'], 51: ['dilahirkan'],
  52: ['nama'], 53: ['gelaran'], 54: ['pekerjaan'], 55: ['kedudukan'], 56: ['identiti'], 57: ['lamakelamaan'], 58: ['itulah'],
  59: ['bayangkan'], 60: ['suatu'], 61: ['bermakna'], 62: ['siapakah', 'tiada'], 63: ['misteri'], 64: ['benarbenar', 'diri', 'sendiri', 'identiti'],
};

// ---------- background ----------
const STARS = new Array(170).fill(0).map((_, i) => ({
  x: random('sx' + i) * W, y: random('sy' + i) * H, r: 0.6 + random('sr' + i) ** 3 * 2.6,
  p: random('sp' + i) * 6.28, s: 0.6 + random('ss' + i) * 1.8, gold: random('sg' + i) < 0.3,
}));
const GALAXY = new Array(1100).fill(0).map((_, i) => {
  const arm = i % 2;
  const r = Math.pow(random('gr' + i), 0.7) * 430;
  const th = r * 0.016 + arm * Math.PI + (random('gt' + i) - 0.5) * (0.9 - r / 900);
  return {r, th, sz: 0.6 + random('gs' + i) * 2.2, a: 0.25 + random('ga' + i) * 0.75};
});

const Galaxy: React.FC<{t: number; cx: number; cy: number; scale: number; opacity: number}> = ({t, cx, cy, scale, opacity}) => {
  if (opacity <= 0.01) return null;
  const rot = t * 0.035;
  return (
    <div style={{position: 'absolute', left: cx - 500, top: cy - 500, width: 1000, height: 1000, opacity,
      transform: `scale(${scale}) rotate(-18deg) scaleY(0.55)`}}>
      <div style={{position: 'absolute', inset: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,226,160,.95) 0%, rgba(240,170,70,.45) 25%, rgba(30,120,110,.15) 60%, transparent 72%)', filter: 'blur(10px)'}} />
      <svg width={1000} height={1000} style={{position: 'absolute'}}>
        {GALAXY.map((g, i) => {
          const a = g.th + rot;
          const k = g.r / 430;
          const col = k < 0.35 ? '#FFE3A3' : k < 0.65 ? '#E9C46A' : '#8FE3D2';
          return <circle key={i} cx={500 + Math.cos(a) * g.r} cy={500 + Math.sin(a) * g.r} r={g.sz} fill={col} opacity={g.a * (1 - k * 0.5)} />;
        })}
      </svg>
    </div>
  );
};

const Cosmos: React.FC<{t: number; galaxy: number}> = ({t, galaxy}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #0B2A27 0%, #061714 45%, #020807 100%)'}}>
    <div style={{position: 'absolute', left: -300 + Math.sin(t / 9) * 60, top: 200, width: 1200, height: 900, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(32,120,104,.35), transparent 65%)', filter: 'blur(40px)'}} />
    <div style={{position: 'absolute', left: 300 + Math.cos(t / 11) * 70, top: 1000, width: 1000, height: 900, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(170,120,40,.22), transparent 65%)', filter: 'blur(50px)'}} />
    <svg width={W} height={H} style={{position: 'absolute'}}>
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={(s.y - t * 4 * s.s + H * 20) % H} r={s.r} fill={s.gold ? '#FFE3A3' : '#DDF7F1'}
          opacity={0.25 + 0.6 * Math.abs(Math.sin(t * s.s + s.p))} />
      ))}
    </svg>
    <Galaxy t={t} cx={540} cy={1150} scale={1.05} opacity={galaxy} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.65) 100%)'}} />
  </AbsoluteFill>
);

// ---------- small building blocks ----------
const Label: React.FC<{x: number; y: number; text: string; o: number; size?: number; color?: string}> = ({x, y, text, o, size = 26, color = GOLD}) => (
  <div style={{position: 'absolute', left: x - 400, top: y, width: 800, textAlign: 'center', fontFamily: CAPS, fontWeight: 500, fontSize: size,
    letterSpacing: size * 0.32, color, opacity: o, textShadow: '0 0 18px rgba(233,196,106,.45)', transform: `translateY(${(1 - o) * 12}px)`}}>
    {text}
  </div>
);

const Orb: React.FC<{x: number; y: number; r: number; color: string; o: number; pulse?: number}> = ({x, y, r, color, o, pulse = 0}) => (
  <div style={{position: 'absolute', left: x - r * 3, top: y - r * 3, width: r * 6, height: r * 6, opacity: o, transform: `scale(${1 + pulse})`,
    background: `radial-gradient(circle, #FFFFFF 0%, ${color} 12%, ${color}55 30%, transparent 62%)`, borderRadius: '50%'}} />
);

// stroke that draws itself (path uses pathLength=1)
const Draw: React.FC<{d: string; p: number; w?: number; c?: string; o?: number}> = ({d, p, w = 4, c = GOLD, o = 1}) => (
  <path d={d} pathLength={1} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray={1} strokeDashoffset={1 - p} opacity={o} style={{filter: `drop-shadow(0 0 8px ${c})`}} />
);

const Figure: React.FC<{x: number; y: number; s?: number; o?: number; glow?: number; walk?: number}> = ({x, y, s = 1, o = 1, glow = 0.6, walk = 0}) => (
  <svg width={300} height={340} style={{position: 'absolute', left: x - 150 * s, top: y - 320 * s, width: 300 * s, height: 340 * s, opacity: o, overflow: 'visible'}} viewBox="-150 -320 300 340">
    <g transform={`translate(0 ${Math.abs(Math.sin(walk)) * -4})`} style={{filter: `drop-shadow(0 0 ${10 + 18 * glow}px rgba(233,196,106,${0.35 + 0.5 * glow}))`}}>
      <circle cx={0} cy={-268} r={24} fill="#06120F" stroke={GOLD} strokeWidth={2.5} />
      <path d={`M-20,-242 Q-46,-170 -${58 + Math.sin(walk) * 6},0 L${58 + Math.cos(walk) * 6},0 Q46,-170 20,-242 Z`} fill="#06120F" stroke={GOLD} strokeWidth={2.5} />
    </g>
  </svg>
);

const Horizon: React.FC<{y: number; o: number}> = ({y, o}) => (
  <div style={{position: 'absolute', left: 0, top: y - 2, width: W, height: 4, opacity: o,
    background: 'linear-gradient(90deg, transparent, rgba(233,196,106,.9) 30%, #FFF2C8 50%, rgba(233,196,106,.9) 70%, transparent)',
    boxShadow: '0 0 30px 6px rgba(233,196,106,.35)'}} />
);

const Beam: React.FC<{o: number; x?: number}> = ({o, x = 540}) => (
  <div style={{position: 'absolute', left: x - 70, top: 0, width: 140, height: 1500, opacity: o, filter: 'blur(18px)',
    background: 'linear-gradient(180deg, rgba(255,240,200,.85), rgba(233,196,106,.35) 60%, transparent)'}} />
);

const Dust: React.FC<{t: number; seed: string; n: number; x: number; y: number; w: number; h: number; o: number; rise?: number}> = ({t, seed, n, x, y, w, h, o, rise = 30}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    {new Array(n).fill(0).map((_, i) => {
      const px = x + random(seed + 'x' + i) * w + Math.sin(t + i) * 8;
      const py = y + ((random(seed + 'y' + i) * h - t * rise * (0.5 + random(seed + 's' + i))) % h + h) % h;
      return <circle key={i} cx={px} cy={py} r={1 + random(seed + 'r' + i) * 2.4} fill="#FFE3A3" opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i))} />;
    })}
  </svg>
);

// crop of the episode cover, placed so that (fx, fy) of the 941x1672 cover sits at the box centre
const CoverCrop: React.FC<{w: number; h: number; fx: number; fy: number; s: number}> = ({w, h, fx, fy, s}) => (
  <Img src={staticFile('ep6_cover.jpg')} style={{position: 'absolute', width: 941 * s, height: 1672 * s, left: w / 2 - fx * s, top: h / 2 - fy * s}} />
);

// ---------- scenes (absolute seconds) ----------
const SceneHook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - ramp(t, 3.6, 0.8);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Img src={staticFile('ep6_cover.jpg')} style={{width: W, height: H, transform: `scale(${1 + t * 0.012})`}} />
    </AbsoluteFill>
  );
};

// 4 – 31.4  two breaths, and a life in between
const SceneDuaDetik: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 4.1, 31.6, 1.0);
  if (o <= 0) return null;
  const L = ramp(t, 9.7, 0.8);
  const R = ramp(t, 12.6, 0.8);
  const forget = ramp(t, 17.3, 1.2); // first breath not remembered: blur
  const unknown = 0.7 + 0.3 * Math.sin(t * 6) * ramp(t, 19.4, 0.5) * (1 - ramp(t, 24, 0.5)); // last breath flickers
  const thread = ramp(t, 24.3, 2.2);
  const life = ramp(t, 29.5, 0.9);
  const y = 1180;
  const wave = new Array(61).fill(0).map((_, i) => {
    const x = 300 + i * 8;
    const k = i / 60;
    const beat = Math.exp(-Math.pow((k - 0.5) * 9, 2)) * 90 * life;
    return `${i ? 'L' : 'M'}${x},${y - Math.sin(k * Math.PI * 6 + t * 3) * 14 * (1 - life * 0.6) - beat * Math.sin(k * Math.PI * 30)}`;
  }).join(' ');
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', inset: 0, filter: `blur(${forget * 6 * (1 - thread)}px)`, opacity: 1}}>
        <Orb x={260} y={y} r={46} color="#FFB347" o={L} pulse={0.08 * Math.sin(t * 2.5)} />
      </div>
      <Orb x={820} y={y} r={42} color="#BFD9FF" o={R * unknown} />
      <Label x={260} y={y + 120} text="NAFAS PERTAMA" o={L} size={22} />
      <Label x={820} y={y + 120} text="NAFAS TERAKHIR" o={R} size={22} color="#CFE0F5" />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Draw d={wave} p={thread} w={3 + life * 2} c={life > 0.5 ? '#FFE3A3' : GOLD} />
      </svg>
      <Label x={540} y={y + 170} text="KEHIDUPAN" o={life} size={40} color="#FFE3A3" />
      <Dust t={t} seed="dd" n={26} x={300} y={y - 160} w={480} h={300} o={life} rise={20} />
    </AbsoluteFill>
  );
};

// 31.4 – 44.8  the womb
const SceneRahim: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 31.6, 44.9, 1.0);
  if (o <= 0) return null;
  const a = ramp(t, 31.6, 1.6);
  const D = 560;
  const beat = Math.pow(Math.max(0, Math.sin(t * 7.2)), 12) * 0.03;
  const unknown = ramp(t, 37.3, 1.0) * (1 - ramp(t, 41.4, 0.8));
  const path = ramp(t, 41.5, 2.6);
  const cy = 1130;
  return (
    <AbsoluteFill style={{opacity: o}}>
      {[0, 1, 2].map((k) => {
        const ph = ((t * 0.5 + k / 3) % 1);
        return <div key={k} style={{position: 'absolute', left: 540 - D / 2, top: cy - D / 2, width: D, height: D, borderRadius: '50%',
          border: '2px solid rgba(255,190,110,.6)', transform: `scale(${1 + ph * 0.5})`, opacity: (1 - ph) * a * 0.7}} />;
      })}
      <div style={{position: 'absolute', left: 540 - D / 2, top: cy - D / 2, width: D, height: D, borderRadius: '50%', overflow: 'hidden', opacity: a,
        transform: `scale(${0.92 + a * 0.08 + beat})`, boxShadow: '0 0 120px 30px rgba(255,150,60,.35)',
        WebkitMaskImage: 'radial-gradient(circle, #000 55%, transparent 71%)', maskImage: 'radial-gradient(circle, #000 55%, transparent 71%)'}}>
        <CoverCrop w={D} h={D} fx={150} fy={815} s={2.05 + (t - 31.4) * 0.006} />
      </div>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Draw d={`M540,${cy + 300} C 520,${cy + 400} 700,${cy + 420} 760,${cy + 520} S 640,${cy + 650} 700,${cy + 760}`} p={path} w={3} />
      </svg>
      <Label x={540} y={cy + 330} text="DUNIA YANG BELUM DIKENALI" o={unknown} size={22} />
      <Label x={800} y={cy + 700} text="PERJALANAN" o={ramp(t, 43.2, 0.8)} size={22} />
    </AbsoluteFill>
  );
};

// 44.8 – 54.5  born: face, voice, love, growing
const SceneLahir: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 44.95, 54.6, 0.9);
  if (o <= 0) return null;
  const burst = ramp(t, 44.8, 1.4);
  const y = 1120;
  const items = [
    {x: 250, t0: 46.8, label: 'WAJAH', d: 'M-45,0 A45,45 0 1,0 45,0 A45,45 0 1,0 -45,0 M-16,-10 L-16,-6 M16,-10 L16,-6 M-20,16 Q0,32 20,16'},
    {x: 540, t0: 48.7, label: 'SUARA', d: 'M-40,-14 L-24,-14 L-4,-34 L-4,34 L-24,14 L-40,14 Z M14,-18 Q26,0 14,18 M26,-32 Q48,0 26,32 M38,-46 Q70,0 38,46'},
    {x: 830, t0: 50.0, label: 'KASIH SAYANG', d: 'M0,40 C-70,-10 -40,-60 0,-26 C40,-60 70,-10 0,40 Z'},
  ];
  const grow = ramp(t, 51.4, 2.6);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Orb x={540} y={y} r={60 + burst * 120} color="#FFE3A3" o={(1 - ramp(t, 46.2, 1.2)) * burst} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {items.map((it, i) => (
          <g key={i} transform={`translate(${it.x} ${y - 60 * grow})`}>
            <Draw d={it.d} p={ramp(t, it.t0, 1.0)} w={4} />
          </g>
        ))}
        <Draw d={`M540,${y + 340} L540,${y + 340 - 230 * grow}`} p={grow} w={4} />
        <Draw d={`M540,${y + 250} Q470,${y + 200} 450,${y + 150}`} p={ramp(t, 52.4, 1)} w={4} />
        <Draw d={`M540,${y + 200} Q620,${y + 160} 640,${y + 100}`} p={ramp(t, 52.9, 1)} w={4} />
      </svg>
      {items.map((it, i) => <Label key={i} x={it.x} y={y + 60 - 60 * grow} text={it.label} o={ramp(t, it.t0 + 0.3, 0.6)} size={20} />)}
      <Horizon y={y + 340} o={grow * 0.8} />
    </AbsoluteFill>
  );
};

// 54.5 – 76.3  chasing what the world offers
const SceneKejar: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 54.7, 76.4, 1.0);
  if (o <= 0) return null;
  const y = 1420;
  const busy = ramp(t, 69.0, 1.2);
  const lost = ramp(t, 71.6, 1.5);
  const icons = [
    {t0: 62.5, label: 'KEKAYAAN', d: 'M-38,10 A38,14 0 1,0 38,10 A38,14 0 1,0 -38,10 M-38,10 L-38,-14 M38,10 L38,-14 M-38,-14 A38,14 0 1,0 38,-14 A38,14 0 1,0 -38,-14 M-38,-14 L-38,-38 M38,-14 L38,-38 M-38,-38 A38,14 0 1,0 38,-38 A38,14 0 1,0 -38,-38'},
    {t0: 63.5, label: 'PENGIKTIRAFAN', d: 'M0,-46 L13,-14 L46,-12 L20,9 L29,42 L0,24 L-29,42 L-20,9 L-46,-12 L-13,-14 Z'},
    {t0: 64.8, label: 'KEDUDUKAN', d: 'M-46,30 L-46,-24 L-22,4 L0,-36 L22,4 L46,-24 L46,30 Z M-46,42 L46,42'},
    {t0: 65.9, label: 'PENERIMAAN', d: 'M-30,-18 A14,14 0 1,0 -2,-18 A14,14 0 1,0 -30,-18 M2,-18 A14,14 0 1,0 30,-18 A14,14 0 1,0 2,-18 M-46,30 Q-16,-12 14,30 M-14,30 Q16,-12 46,30'},
  ];
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Horizon y={y} o={ramp(t, 54.6, 1.2)} />
      <Figure x={540 - 160 * (1 - busy) * ramp(t, 59.0, 0.5) + Math.sin(t * 1.3) * 10 * (1 - busy)} y={y} s={0.85} walk={t * 5 * (1 - busy)} o={ramp(t, 55.0, 1)} glow={0.4} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {icons.map((ic, i) => {
          const appear = ramp(t, ic.t0, 0.8);
          // first: they hang ahead, out of reach; later they circle around the busy figure
          const ax = 260 + i * 190 + Math.sin(t * 1.2 + i) * 12;
          const ay = 820 + (i % 2) * 120 + Math.cos(t * 1.1 + i) * 10;
          const ang = t * 0.9 + (i * Math.PI) / 2;
          const bx = 540 + Math.cos(ang) * 300;
          const by = 1100 + Math.sin(ang) * 120;
          const x = interpolate(busy, [0, 1], [ax, bx]);
          const yy = interpolate(busy, [0, 1], [ay, by]);
          return (
            <g key={i} transform={`translate(${x} ${yy}) scale(${0.8 + appear * 0.2})`} opacity={1 - lost * 0.55}>
              <Draw d={ic.d} p={appear} w={4} />
            </g>
          );
        })}
      </svg>
      {icons.map((ic, i) => {
        const ax = 260 + i * 190;
        const ay = 820 + (i % 2) * 120;
        return <Label key={i} x={ax} y={ay + 62} text={ic.label} o={ramp(t, ic.t0 + 0.2, 0.5) * (1 - busy)} size={17} />;
      })}
      {/* building blocks of a busy life */}
      {[0, 1, 2, 3, 4].map((k) => {
        const b = ramp(t, 69.3 + k * 0.4, 0.5);
        return <div key={k} style={{position: 'absolute', left: 700 + (k % 2) * 30, top: y - 44 - k * 44, width: 90, height: 40, border: `2px solid ${GOLD}`,
          background: 'rgba(233,196,106,.12)', opacity: b * (1 - lost * 0.5), transform: `translateY(${(1 - b) * -80}px)`}} />;
      })}
      <div style={{position: 'absolute', left: 440, top: y - 470, width: 200, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 150,
        color: GOLD, opacity: ramp(t, 73.3, 1) * (0.7 + 0.3 * Math.sin(t * 3)), textShadow: '0 0 30px rgba(233,196,106,.7)'}}>?</div>
    </AbsoluteFill>
  );
};

// 76.3 – 88.1  the Quran: "dikembalikan"
const VERSE1 = 'كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ';
const VERSE2 = 'ثُمَّ إِلَيْنَا تُرْجَعُونَ';
const SceneQuran: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 76.5, 88.2, 1.0);
  if (o <= 0) return null;
  const book = ramp(t, 76.4, 2.0) * (1 - ramp(t, 80.6, 0.6));
  const word = ramp(t, 81.0, 0.8) * (1 - ramp(t, 82.3, 0.6));
  const v1 = ramp(t, 82.4, 1.0);
  const v2 = ramp(t, 85.3, 1.0);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Beam o={0.35 + 0.4 * Math.max(word, v2)} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <g transform="translate(540 1120)">
          <Draw d="M0,-60 Q-90,-110 -190,-80 L-190,90 Q-90,60 0,110 Q90,60 190,90 L190,-80 Q90,-110 0,-60 Z M0,-60 L0,110" p={book} w={4} o={book > 0 ? 1 : 0} />
          {[0, 1, 2].map((k) => <Draw key={k} d={`M-160,${-40 + k * 40} Q-90,${-62 + k * 40} -30,${-34 + k * 40} M30,${-34 + k * 40} Q90,${-62 + k * 40} 160,${-40 + k * 40}`} p={ramp(t, 77.6 + k * 0.4, 0.8)} w={2} o={book * 0.7} />)}
        </g>
      </svg>
      <div style={{position: 'absolute', top: 950, width: W, textAlign: 'center', opacity: word, transform: `scale(${0.9 + word * 0.1})`}}>
        <div style={{fontFamily: ARAB, fontSize: 170, color: '#FFF2C8', textShadow: '0 0 40px rgba(233,196,106,.8)', direction: 'rtl'}}>تُرْجَعُونَ</div>
        <Label x={540} y={30} text="DIKEMBALIKAN" o={word} size={30} />
      </div>
      <div style={{position: 'absolute', top: 930, width: W, textAlign: 'center', direction: 'rtl'}}>
        <div style={{fontFamily: ARAB, fontSize: 84, color: '#F3EAD3', opacity: v1, transform: `translateY(${(1 - v1) * 20}px)`, textShadow: '0 0 20px rgba(0,0,0,.8)'}}>{VERSE1}</div>
        <div style={{fontFamily: ARAB, fontSize: 96, marginTop: 20, color: v2 > 0.5 ? '#FFE3A3' : '#F3EAD3', opacity: v2, transform: `translateY(${(1 - v2) * 20}px)`,
          textShadow: `0 0 ${30 * v2}px rgba(233,196,106,.8)`}}>{VERSE2}</div>
      </div>
      <Label x={540} y={1290} text="QS. AL-'ANKABUT : 57" o={v1} size={22} />
    </AbsoluteFill>
  );
};

// 88.1 – 113.1  why love, loss, sorrow, letting go
const HEART = 'M0,120 C-200,-30 -110,-170 0,-80 C110,-170 200,-30 0,120 Z';
const SceneMengapa: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 88.3, 113.2, 1.0);
  if (o <= 0) return null;
  const cy = 1130;
  const ret = ramp(t, 88.3, 1.2) * (1 - ramp(t, 95.0, 0.8)); // "kembali": loop path
  const love = ramp(t, 95.9, 1.4);
  const crack = ramp(t, 98.4, 0.7);
  const split = ramp(t, 99.3, 1.2) * (1 - ramp(t, 101.3, 1.2));
  const tears = ramp(t, 99.5, 0.6) * (1 - ramp(t, 101.6, 0.6));
  const release = ramp(t, 101.4, 3.0);
  const deep = ramp(t, 105.2, 2.0);
  const heartO = love * (1 - release * 0.85);
  const lightY = cy - release * 520 - deep * 200;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <g transform={`translate(540 ${cy})`} opacity={ret}>
          <Draw d="M-260,80 C-260,-160 260,-160 260,0 C260,120 60,140 0,60 C-40,0 40,-60 90,-20" p={ramp(t, 88.4, 4.0)} w={3} />
        </g>
        <g transform={`translate(540 ${cy})`} opacity={heartO}>
          <g transform={`translate(${-split * 40} 0) rotate(${-split * 6})`}>
            <Draw d={HEART} p={love} w={5} c={crack > 0.5 ? '#D9B45A' : GOLD} />
          </g>
          {split > 0 && <g transform={`translate(${split * 40} 0) rotate(${split * 6})`}><path d="M0,-80 L0,120" stroke="transparent" /></g>}
          <Draw d="M0,-80 L-18,-40 L14,-10 L-14,30 L10,70 L0,120" p={crack} w={4} c="#FFF2C8" o={1 - release} />
        </g>
      </svg>
      {/* tears */}
      <svg width={W} height={H} style={{position: 'absolute', opacity: tears}}>
        {new Array(14).fill(0).map((_, i) => {
          const x = 380 + random('tx' + i) * 320;
          const yy = cy - 60 + (((t - 99.5) * 260 + random('ty' + i) * 400) % 400);
          return <path key={i} d={`M${x},${yy} q-7,14 0,20 q7,-6 0,-20`} fill="#BFD9FF" opacity={0.75} />;
        })}
      </svg>
      {/* the light that is released */}
      <Orb x={540} y={lightY} r={26 + deep * 30} color="#FFE3A3" o={release} pulse={0.06 * Math.sin(t * 3)} />
      <Dust t={t} seed="mg" n={60} x={160} y={600} w={760} h={900} o={deep} rise={45} />
      <Label x={540} y={cy + 170} text="CINTA" o={love * (1 - crack)} size={24} />
      <Label x={540} y={cy + 170} text="KEHILANGAN" o={crack * (1 - tears)} size={24} />
      <Label x={540} y={cy + 170} text="KESEDIHAN" o={tears} size={24} color="#CFE0F5" />
      <Label x={540} y={cy + 170} text="MELEPASKAN" o={release * (1 - deep)} size={24} />
    </AbsoluteFill>
  );
};

// 113.1 – 125.4  the traveller: from where, to where, who?
const SceneMusafir: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 113.3, 125.5, 1.0);
  if (o <= 0) return null;
  const a = ramp(t, 113.1, 1.5);
  const BW = 760;
  const BH = 900;
  const top = 680;
  const who = ramp(t, 121.6, 0.8);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{position: 'absolute', left: 540 - BW / 2, top, width: BW, height: BH, overflow: 'hidden', opacity: a,
        borderRadius: `${BW / 2}px ${BW / 2}px 30px 30px`, border: `2px solid rgba(233,196,106,.55)`, boxShadow: '0 0 80px rgba(233,196,106,.25)',
        WebkitMaskImage: 'linear-gradient(180deg,#000 75%, transparent)', maskImage: 'linear-gradient(180deg,#000 75%, transparent)'}}>
        <CoverCrop w={BW} h={BH} fx={470} fy={930 - (t - 113.1) * 3} s={1.75 + (t - 113.1) * 0.012} />
        <AbsoluteFill style={{background: `rgba(2,10,8,${0.15 + who * 0.35})`}} />
      </div>
      <Label x={250} y={top + BH - 120} text="DARI MANA?" o={ramp(t, 116.9, 0.6)} size={24} />
      <Label x={830} y={top + BH - 120} text="KE MANA?" o={ramp(t, 118.9, 0.6)} size={24} />
      <div style={{position: 'absolute', top: top + 300, width: W, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 140,
        color: '#FFE3A3', opacity: who, transform: `scale(${1.2 - who * 0.2})`, textShadow: '0 0 40px rgba(0,0,0,.9), 0 0 30px rgba(233,196,106,.7)'}}>Siapa?</div>
    </AbsoluteFill>
  );
};

// 125.4 – 147.4  names, titles, identities... then they fall away
const TAGS = [
  {t0: 129.2, text: 'NAMA', x: 300, y: 860},
  {t0: 130.4, text: 'GELARAN', x: 790, y: 900},
  {t0: 131.3, text: 'PEKERJAAN', x: 250, y: 1080},
  {t0: 132.3, text: 'KEDUDUKAN', x: 830, y: 1110},
  {t0: 133.4, text: 'IDENTITI', x: 330, y: 1290},
  {t0: 133.8, text: 'PANGKAT', x: 760, y: 1320},
];
const SceneIdentiti: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 125.6, 147.6, 1.0);
  if (o <= 0) return null;
  const y = 1520;
  const close = ramp(t, 136.3, 2.5);
  const gone = ramp(t, 143.0, 3.4);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Horizon y={y} o={0.7} />
      <Figure x={540} y={y} s={1.2} o={ramp(t, 125.6, 1)} glow={0.2 + gone * 0.8} />
      {TAGS.map((g, i) => {
        const a = ramp(t, g.t0, 0.5);
        const x = interpolate(close, [0, 1], [g.x, 540 + (g.x < 540 ? -150 : 150)]);
        const yy = interpolate(close, [0, 1], [g.y, 1180 + i * 40]);
        const d = Math.min(1, Math.max(0, gone * 1.6 - i * 0.12));
        return (
          <div key={i} style={{position: 'absolute', left: x - 170, top: yy - 34, width: 340, textAlign: 'center',
            opacity: a * (1 - d), filter: `blur(${d * 14}px)`, transform: `translateY(${-d * 120}px) scale(${1 + d * 0.3})`}}>
            <span style={{display: 'inline-block', padding: '10px 26px', border: `2px solid ${GOLD}`, borderRadius: 8, background: 'rgba(6,18,15,.82)',
              fontFamily: CAPS, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: GOLD, boxShadow: '0 0 24px rgba(233,196,106,.3)'}}>{g.text}</span>
          </div>
        );
      })}
      <Dust t={t} seed="id" n={70} x={200} y={760} w={680} h={700} o={Math.min(1, gone * 2) * (1 - ramp(t, 146.6, 0.8))} rise={70} />
    </AbsoluteFill>
  );
};

// 147.4 – 164.1  who are you, without them?
const SceneDiri: React.FC<{t: number}> = ({t}) => {
  const o = win(t, 147.6, 164.2, 1.0);
  if (o <= 0) return null;
  const y = 1300;
  const core = ramp(t, 154.2, 3) * (0.8 + 0.2 * Math.sin(t * 2));
  const mirror = ramp(t, 156.2, 2);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Beam o={0.25 + core * 0.3} />
      <Horizon y={y} o={0.8} />
      <Figure x={540} y={y} s={1.15} glow={1} />
      <Orb x={540} y={y - 200} r={14 + core * 10} color="#FFE3A3" o={core} />
      {/* reflection in still water */}
      <div style={{position: 'absolute', left: 0, top: y, width: W, height: 420, overflow: 'hidden', opacity: mirror * 0.55,
        WebkitMaskImage: 'linear-gradient(180deg,#000, transparent 80%)', maskImage: 'linear-gradient(180deg,#000, transparent 80%)'}}>
        <div style={{position: 'absolute', left: 0, top: -y, width: W, height: H, transform: `scaleY(-1)`, transformOrigin: `540px ${y}px`,
          filter: `blur(2px)`, opacity: 0.9}}>
          <Figure x={540 + Math.sin(t * 2) * 4} y={y} s={1.15} glow={0.6} />
        </div>
      </div>
      <Label x={540} y={y + 360} text="SIAPA DIRI KITA YANG SEBENAR?" o={ramp(t, 158.5, 1) * (1 - ramp(t, 163.5, 0.6))} size={22} />
    </AbsoluteFill>
  );
};

// 164.1 – end  next episode + sign-off
const Ornament: React.FC<{y: number; o: number; w?: number}> = ({y, o, w = 620}) => (
  <svg width={W} height={40} style={{position: 'absolute', top: y - 20, left: 0, opacity: o}}>
    <line x1={540 - w / 2} y1={20} x2={520} y2={20} stroke={GOLD} strokeWidth={2} />
    <line x1={560} y1={20} x2={540 + w / 2} y2={20} stroke={GOLD} strokeWidth={2} />
    <path d="M540,8 L552,20 L540,32 L528,20 Z" fill={GOLD} />
  </svg>
);
const SceneSeterusnya: React.FC<{t: number}> = ({t}) => {
  const o = ramp(t, 164.0, 1.0) * (1 - ramp(t, EP6_DURATION - 1.2, 1.1));
  if (o <= 0) return null;
  const ep = ramp(t, 164.6, 1.0);
  const title = ramp(t, 167.4, 1.2);
  const sign = ramp(t, 170.2, 1.2);
  const swap = ramp(t, 170.0, 0.8);
  return (
    <AbsoluteFill style={{opacity: o}}>
      <div style={{opacity: 1 - swap * 0.25, transform: `translateY(${-swap * 140}px)`}}>
        <Label x={540} y={560} text="SIRI MISTERI KEHIDUPAN" o={ep} size={26} />
        <Ornament y={630} o={ep} />
        <div style={{position: 'absolute', top: 670, width: W, textAlign: 'center', fontFamily: CAPS, fontWeight: 700, fontSize: 78, letterSpacing: 10,
          opacity: ep, color: GOLD, textShadow: '0 0 30px rgba(233,196,106,.5)'}}>EPISOD 7</div>
        <Ornament y={790} o={ep} />
        <div style={{position: 'absolute', top: 850, width: W, textAlign: 'center', fontFamily: SERIF, fontWeight: 600, fontSize: 96, lineHeight: 1.08,
          color: '#F6EEDB', opacity: title, transform: `translateY(${(1 - title) * 30}px)`, textShadow: '0 4px 24px rgba(0,0,0,.8)'}}>
          Siapa Anda<br /><span style={{fontStyle: 'italic', color: '#FFE3A3'}}>Tanpa Nama</span><br />dan Gelaran?
        </div>
      </div>
      <div style={{position: 'absolute', top: 1360, width: W, textAlign: 'center', opacity: sign, transform: `translateY(${(1 - sign) * 30}px)`}}>
        <div style={{fontFamily: SERIF, fontWeight: 600, fontStyle: 'italic', fontSize: 84, color: '#FFE3A3', textShadow: '0 0 30px rgba(233,196,106,.6)'}}>Rafee Ailiah</div>
        <div style={{marginTop: 14, fontFamily: CAPS, fontWeight: 500, fontSize: 26, letterSpacing: 7, color: '#E8DCC0'}}>SAHABAT HATI &amp; FIKIRAN ANDA</div>
      </div>
      <Dust t={t} seed="end" n={40} x={120} y={500} w={840} h={1200} o={0.8} rise={25} />
    </AbsoluteFill>
  );
};

// ---------- captions ----------
const LAST_CAPTION = 64; // cues 65..67 are shown by the end card instead
const Caption: React.FC<{t: number}> = ({t}) => {
  let idx = -1;
  for (let i = 0; i <= LAST_CAPTION; i++) if (t >= cues[i].t - 0.12) idx = i;
  if (idx < 0) return null;
  const c = cues[idx];
  const next = idx < LAST_CAPTION ? cues[idx + 1].t - 0.12 : c.end + 1.0;
  const until = Math.min(next, c.end + 1.6);
  const out = 1 - ramp(t, until - 0.25, 0.25);
  if (out <= 0) return null;
  const hl = new Set((HL[idx] || []).map(norm));
  const long = c.text.length > 70;
  return (
    <div style={{position: 'absolute', left: 80, top: 230, width: W - 160, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: out}}>
      <div style={{textAlign: 'center', fontFamily: SERIF, fontWeight: 500, fontSize: long ? 62 : 76, lineHeight: 1.18, color: '#F3EAD3',
        textShadow: '0 3px 18px rgba(0,0,0,.85)'}}>
        {c.words.map(([w, wt], i) => {
          const a = ramp(t, wt - 0.08, 0.35);
          const isHl = hl.has(norm(w));
          return (
            <span key={i} style={{display: 'inline-block', marginRight: '0.24em', opacity: a, filter: `blur(${(1 - a) * 6}px)`,
              transform: `translateY(${(1 - a) * 12}px)`,
              ...(isHl ? {fontStyle: 'italic', fontWeight: 600, color: GOLD, textShadow: '0 0 22px rgba(233,196,106,.55), 0 3px 18px rgba(0,0,0,.85)'} : {})}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const SeriesTag: React.FC<{t: number}> = ({t}) => {
  const o = ramp(t, 4.4, 1) * (1 - ramp(t, 163.6, 0.8)) * 0.6;
  return <Label x={540} y={120} text="SIRI MISTERI KEHIDUPAN · EPISOD 6" o={o} size={20} />;
};

export const Episod6: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  // galaxy fills the gaps: intro questions, the "mendalam" ending, and behind the end card
  const galaxy = 0.55 * win(t, 4.3, 9.9, 1.2) + 0.45 * win(t, 105.5, 113.4, 1.5) + 0.35 * ramp(t, 164.5, 1.5);
  const end = durationInFrames / fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#020807'}}>
      <Audio src={staticFile('ep6_vo.mp3')} />
      <Audio src={staticFile('ep6_music.m4a')} volume={(f) => {
        const s = f / fps;
        return 0.14 * interpolate(s, [0, 1.5], [0.4, 1], clamp) * interpolate(s, [173.5, 175.5], [1, 1.9], clamp) * interpolate(s, [end - 3, end], [1, 0], clamp);
      }} />
      <Cosmos t={t} galaxy={galaxy} />
      <SceneDuaDetik t={t} />
      <SceneRahim t={t} />
      <SceneLahir t={t} />
      <SceneKejar t={t} />
      <SceneQuran t={t} />
      <SceneMengapa t={t} />
      <SceneMusafir t={t} />
      <SceneIdentiti t={t} />
      <SceneDiri t={t} />
      <SceneSeterusnya t={t} />
      <SeriesTag t={t} />
      {t > 3.9 && <Caption t={t} />}
      <SceneHook t={t} />
    </AbsoluteFill>
  );
};
