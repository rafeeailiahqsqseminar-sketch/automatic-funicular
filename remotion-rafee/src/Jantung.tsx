import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp} from './Mukadimah';
import {Captions, Word} from './Captions';

// "Otak di Dalam Jantung": voice-over only (no footage), so everything is drawn.
// Top: fixed title. Middle: brain + heart stage that changes per idea. Below: stage label, karaoke captions, live ECG.

export type JStage = {t: number; name: string; note: string; hl?: string};
export type JantungProps = {audio?: string; words: Word[]; stages: JStage[]; endT: number; fastT: [number, number]};

const GOLD = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#B86A00 100%)';
const RED = '#FF3B5C';
const CYAN = '#5FE3FF';
const ST_TOP = 380; // stage svg top
const HEART = 'M0,150 C-60,95 -180,20 -180,-70 C-180,-140 -125,-180 -70,-175 C-35,-172 -10,-150 0,-120 C10,-150 35,-172 70,-175 C125,-180 180,-140 180,-70 C180,20 60,95 0,150 Z';
const BRAIN_L = 'M-6,-70 C-30,-92 -70,-86 -80,-60 C-110,-58 -122,-26 -106,-4 C-122,16 -108,50 -78,52 C-70,74 -36,80 -16,64 C-10,60 -6,52 -6,44 Z';
const sm = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const g = (x: number, m: number, s: number) => Math.exp(-(((x - m) / s) ** 2));

// heart rate: calm 66 bpm, racing ~124 bpm while he talks about "berdegup kencang"
const bpm = (t: number, fast: [number, number]) => 66 + 58 * sm(fast[0], fast[0] + 1.2, t) - 58 * sm(fast[1], fast[1] + 1.5, t);
const usePhase = (fast: [number, number]) =>
  React.useMemo(() => {
    const p = new Float64Array(7000);
    for (let i = 1; i < p.length; i++) p[i] = p[i - 1] + bpm(i / 100, fast) / 60 / 100;
    return (t: number) => {
      const x = Math.max(0, Math.min(p.length - 2, t * 100));
      const i = Math.floor(x);
      return p[i] + (p[i + 1] - p[i]) * (x - i);
    };
  }, [fast[0], fast[1]]);
const pulse = (ph: number) => {
  const f = ph - Math.floor(ph);
  return g(f, 0.05, 0.045) + 0.55 * g(f, 0.27, 0.045);
};
const ecg = (ph: number) => {
  const f = ph - Math.floor(ph);
  return 0.12 * g(f, 0.93, 0.03) - 0.15 * g(f, 0.035, 0.009) + g(f, 0.05, 0.011) - 0.32 * g(f, 0.068, 0.011) + 0.26 * g(f, 0.3, 0.045);
};

const Particles: React.FC<{frame: number}> = ({frame}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    {new Array(55).fill(0).map((_, i) => {
      const x = random('jx' + i) * 1080;
      const sp = 0.3 + random('js' + i) * 0.8;
      const y = (random('jy' + i) * 1920 - frame * sp * 2 + 1920 * 10) % 1920;
      const r = 1 + random('jr' + i) * 2.5;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (12 + random('jt' + i) * 20) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#FFC2CC' : '#FFE9A0'} opacity={0.45 * tw} />;
    })}
  </svg>
);

const Title: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const a = spring({frame: frame - 2, fps, config: {damping: 14}});
  const k = spring({frame: frame - 9, fps, config: {damping: 11, stiffness: 150}});
  const glow = 0.6 + 0.4 * Math.sin(frame / 18);
  const sweep = ((frame % 150) / 150) * 260 - 80;
  return (
    <div style={{position: 'absolute', top: 70, width: 1080, textAlign: 'center'}}>
      <div style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 30, letterSpacing: 7, color: '#FFB3C0',
        padding: '6px 20px', border: `2px solid ${RED}`, borderRadius: 30, background: 'rgba(24,4,12,.6)', opacity: a,
        boxShadow: `0 0 ${16 * glow}px rgba(255,59,92,.6)`}}>SAINS · NEUROKARDIOLOGI</div>
      <div style={{marginTop: 18, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 64, letterSpacing: 4, color: 'white',
        textShadow: '0 3px 14px rgba(0,0,0,.8)', opacity: a, transform: `translateY(${(1 - a) * -30}px)`}}>OTAK DI DALAM</div>
      <div style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 128, lineHeight: 1, letterSpacing: -2, marginTop: 2,
        backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${sweep - 10}%, rgba(255,255,255,.95) ${sweep}%, rgba(255,255,255,0) ${sweep + 10}%), ${GOLD}`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        filter: `drop-shadow(0 5px 0 #5A2E00) drop-shadow(0 0 ${20 + 14 * glow}px rgba(255,59,92,.5))`,
        opacity: k, transform: `translateY(${(1 - k) * 80}px) scale(${interpolate(k, [0, 1], [1.4, 1])})`}}>JANTUNG</div>
    </div>
  );
};

const Brain: React.FC<{x: number; y: number; s: number; glow: number; op: number}> = ({x, y, s, glow, op}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
    <ellipse cx={0} cy={0} rx={150} ry={110} fill={`rgba(95,227,255,${0.18 * glow})`} filter="url(#jblur)" />
    {[1, -1].map((m) => (
      <g key={m} transform={`scale(${m},1)`}>
        <path d={BRAIN_L} fill="rgba(20,40,70,.75)" stroke="url(#jgold)" strokeWidth={6} strokeLinejoin="round" />
        <path d="M-30,-60 C-48,-40 -30,-26 -52,-8 M-90,-14 C-70,-6 -66,14 -46,10 M-80,40 C-62,26 -44,40 -30,22 M-20,-20 C-34,0 -18,16 -26,40"
          fill="none" stroke="url(#jgold)" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      </g>
    ))}
    <rect x={-6} y={-60} width={12} height={110} fill="rgba(20,40,70,.9)" />
    <path d="M0,44 C0,60 6,72 14,84" stroke="url(#jgold)" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

// neurons inside the heart (positions are fixed, made once)
const NODES = (() => {
  const pts: [number, number][] = [];
  let i = 0;
  while (pts.length < 34 && i < 2000) {
    const x = (random('nx' + i) - 0.5) * 320;
    const y = -150 + random('ny' + i) * 270;
    i++;
    // inside heart test: two circles on top + triangle below
    const inTop = (x + 72) ** 2 + (y + 72) ** 2 < 95 ** 2 || (x - 72) ** 2 + (y + 72) ** 2 < 95 ** 2;
    const inLow = y > -80 && y < 135 && Math.abs(x) < 165 * (1 - (y + 80) / 225);
    if ((inTop || inLow) && pts.every(([a, b]) => (a - x) ** 2 + (b - y) ** 2 > 38 ** 2)) pts.push([x, y]);
  }
  const edges: [number, number][] = [];
  pts.forEach((p, a) => {
    const near = pts.map((q, b) => [b, (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2] as [number, number]).filter(([b]) => b !== a).sort((u, v) => u[1] - v[1]);
    near.slice(0, 2).forEach(([b]) => {
      if (!edges.some(([c, d]) => (c === b && d === a) || (c === a && d === b))) edges.push([a, b]);
    });
  });
  return {pts, edges};
})();

const Heart: React.FC<{x: number; y: number; s: number; beat: number; t: number; net: number; mini: number; op: number; alarm: number}> = ({x, y, s, beat, t, net, mini, op, alarm}) => {
  const sc = s * (1 + 0.065 * beat);
  return (
    <g transform={`translate(${x},${y}) scale(${sc})`} opacity={op}>
      <path d={HEART} fill={`rgba(255,40,80,${0.35 + 0.35 * beat + 0.2 * alarm})`} filter="url(#jblur)" transform="scale(1.12)" />
      <path d={HEART} fill="url(#jheart)" stroke="url(#jgold)" strokeWidth={7} />
      <path d="M-120,-110 C-150,-80 -150,-30 -130,0" stroke="rgba(255,255,255,.55)" strokeWidth={14} fill="none" strokeLinecap="round" />
      <g clipPath="url(#jclip)">
        {NODES.edges.map(([a, b], i) => {
          const p = NODES.pts[a];
          const q = NODES.pts[b];
          const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
          const k = Math.min(1, Math.max(0, net * NODES.edges.length * 0.5 - i * 0.5));
          return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#FFE9A0" strokeWidth={2.5} strokeDasharray={L} strokeDashoffset={L * (1 - k)} opacity={0.75} />;
        })}
        {NODES.pts.map(([px, py], i) => {
          const k = Math.min(1, Math.max(0, net * NODES.pts.length - i * 0.6));
          const tw = 0.6 + 0.4 * Math.sin(t * 6 + i * 1.7);
          return <circle key={i} cx={px} cy={py} r={(6 + 3 * beat) * k} fill="#FFF6C8" opacity={tw} style={{filter: 'drop-shadow(0 0 6px #FFD45A)'}} />;
        })}
      </g>
      {mini > 0 ? <Brain x={0} y={-30} s={0.42 * mini} glow={1} op={mini} /> : null}
    </g>
  );
};

const StageLabel: React.FC<{s: JStage; f: number; fps: number; t: number; out: number}> = ({s, f, fps, t, out}) => {
  const k = spring({frame: f, fps, config: {damping: 13, stiffness: 160}});
  const chars = Math.floor(interpolate(f, [10, 10 + s.note.length * 0.9], [0, s.note.length], clamp));
  // "40,000 NEURON": count up while he says it
  let name = s.name;
  if (name.includes('40,000')) name = `${Math.round(40000 * Easing.out(Easing.cubic)(sm(19.2, 25.3, t))).toLocaleString('en-US')} NEURON`;
  const parts = s.hl ? name.split(s.hl) : [name];
  const gold = {backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 0 #5A2E00)'} as const;
  return (
    <div style={{position: 'absolute', top: 1268, width: 1080, textAlign: 'center', opacity: 1 - out, filter: `blur(${out * 10}px)`}}>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, height: 104, opacity: k,
        filter: `blur(${(1 - k) * 12}px)`, transform: `translateY(${(1 - k) * 50}px)`, fontFamily: 'Inter Display', fontWeight: 900,
        fontSize: name.length > 13 ? 76 : 90, lineHeight: 1}}>
        {parts[0] ? <span style={gold}>{parts[0].trim()}</span> : null}
        {s.hl ? (
          <span style={{color: 'white', background: RED, borderRadius: 16, padding: '6px 18px', boxShadow: `0 0 26px ${RED}`,
            transform: `scale(${spring({frame: f - 6, fps, config: {damping: 10, stiffness: 170}})})`, display: 'inline-block'}}>{s.hl}</span>
        ) : null}
        {parts[1] ? <span style={gold}>{parts[1].trim()}</span> : null}
      </div>
      <div style={{marginTop: 6, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 42, color: 'white', minHeight: 54,
        textShadow: '0 2px 12px rgba(0,0,0,.9)', padding: '0 50px'}}>{s.note.slice(0, chars)}</div>
    </div>
  );
};

const Ecg: React.FC<{t: number; phase: (t: number) => number; alarm: number; fast: [number, number]}> = ({t, phase, alarm, fast}) => {
  const W = 1080;
  const speed = 300; // px per second
  const pts: string[] = [];
  for (let x = 0; x <= 960; x += 4) {
    const v = ecg(phase(Math.max(0, t - (960 - x) / speed)));
    pts.push(`${x + 60},${60 - v * 52}`);
  }
  const col = alarm > 0.5 ? '#FF6B84' : '#7CFFB2';
  return (
    <svg width={W} height={130} style={{position: 'absolute', top: 1745}}>
      <polyline points={pts.join(' ')} fill="none" stroke={col} strokeWidth={4} strokeLinejoin="round" opacity={0.9} style={{filter: `drop-shadow(0 0 8px ${col})`}} />
      <circle cx={1020} cy={60 - ecg(phase(t)) * 52} r={9} fill="white" style={{filter: `drop-shadow(0 0 10px ${col})`}} />
      <text x={60} y={122} fontFamily="Inter Display" fontWeight={800} fontSize={26} fill="rgba(255,255,255,.75)" letterSpacing={3}>
        {'\u2665 ' + Math.round(bpm(t, fast)) + ' BPM'}
      </text>
    </svg>
  );
};

const EndCard: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const k = spring({frame: f, fps, config: {damping: 13}});
  const k2 = spring({frame: f - 8, fps, config: {damping: 10, stiffness: 160}});
  return (
    <div style={{position: 'absolute', top: 840, left: 140, width: 800, height: 280, borderRadius: 40,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(92,18,40,.94), rgba(26,4,12,.95))', border: '3px solid rgba(255,200,70,.95)',
      boxShadow: '0 0 50px rgba(255,170,30,.5)', textAlign: 'center', opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.85, 1])})`}}>
      <div style={{marginTop: 46, fontFamily: 'Inter Display', fontWeight: 900, fontSize: 112, lineHeight: 1, backgroundImage: GOLD,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 0 #5A2E00)'}}>KLIK LINK</div>
      <div style={{marginTop: 18, display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 64, color: 'white',
        background: RED, borderRadius: 18, padding: '4px 30px', transform: `scale(${k2})`, boxShadow: `0 0 30px ${RED}`}}>DI BIO</div>
    </div>
  );
};

export const Jantung: React.FC<JantungProps> = ({audio, words, stages, endT, fastT}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const phase = usePhase(fastT);
  const beat = pulse(phase(t));
  let si = 0;
  stages.forEach((s, i) => {
    if (t >= s.t) si = i;
  });
  const T = stages.map((s) => s.t);
  const e = (a: number, d = 0.8) => sm(a, a + d, t);
  // stage layout (svg coords, stage is 1080 x 900)
  const heartIn = spring({frame: frame - Math.round(T[1] * fps), fps, config: {damping: 12, stiffness: 120}});
  const zoom = e(T[2]) - e(T[4] - 0.4); // close-up during neurons
  const centre = e(T[5] - 0.3); // heart to the middle for "keputusan mikro" and racing
  const endK = e(endT - 0.2, 0.7);
  const hx = 540;
  const hy = interpolate(zoom, [0, 1], [600, 470]) + (520 - 600) * centre * (1 - zoom) - 330 * endK;
  const hs = (interpolate(zoom, [0, 1], [1, 1.55]) + 0.2 * centre * (1 - zoom)) * (1 - 0.45 * endK);
  const brainOp = (1 - 0.85 * zoom) * (1 - endK);
  const brainGlow = t < T[1] ? 0.6 + 0.4 * Math.sin(t * 5) : 0.35 + 0.65 * sm(42.2, 43.2, t) * (1 - e(T[6]));
  const net = sm(T[2] + 0.4, T[3] + 1.5, t);
  const mini = e(T[1] + 1.2) * (1 - e(T[2]));
  const alarm = e(T[6]) * (1 - e(endT - 1));
  const channel = e(T[4] + 2) * (1 - endK);
  const radar = e(T[5]) * (1 - e(T[6] + 1));
  // nerve channel heart -> brain
  const y0 = hy - 120 * hs; // heart top
  const y1 = 262; // brain base
  const path = (u: number) => [540 + 26 * Math.sin(u * Math.PI * 3), y0 + (y1 - y0) * u];
  const sig: React.ReactNode[] = [];
  if (channel > 0) {
    for (let i = 0; i < 9; i++) {
      const u = (t * 0.55 + i / 9) % 1; // many signals going up
      const [x, y] = path(u);
      sig.push(<circle key={'u' + i} cx={x} cy={y} r={11} fill="#FFE27A" opacity={channel * Math.sin(u * Math.PI)} style={{filter: 'drop-shadow(0 0 10px #FFD45A)'}} />);
    }
    const u = 1 - ((t * 0.3) % 1); // one signal coming down
    const [x, y] = path(u);
    sig.push(<circle key="d" cx={x} cy={y} r={8} fill={CYAN} opacity={channel * Math.sin(u * Math.PI)} style={{filter: `drop-shadow(0 0 8px ${CYAN})`}} />);
  }
  const endF = Math.round(endT * fps);
  const labelOut = interpolate(frame, [endF - 6, endF + 4], [0, 1], clamp);
  const bgPulse = 0.25 + 0.35 * beat * (0.6 + 0.6 * alarm);
  return (
    <AbsoluteFill style={{backgroundColor: '#0B030A', overflow: 'hidden'}}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 45% at 50% 52%, rgba(150,14,46,${bgPulse}) 0%, rgba(40,6,24,.6) 55%, rgba(6,4,16,1) 100%)`}} />
      <Particles frame={frame} />
      <svg width={1080} height={900} style={{position: 'absolute', top: ST_TOP}}>
        <defs>
          <linearGradient id="jgold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF6C8" />
            <stop offset=".35" stopColor="#FFD45A" />
            <stop offset=".7" stopColor="#F2B023" />
            <stop offset="1" stopColor="#B86A00" />
          </linearGradient>
          <radialGradient id="jheart" cx=".38" cy=".3" r=".85">
            <stop offset="0" stopColor="#FF9AAE" />
            <stop offset=".45" stopColor="#E8203F" />
            <stop offset="1" stopColor="#6E0620" />
          </radialGradient>
          <clipPath id="jclip">
            <path d={HEART} />
          </clipPath>
          <filter id="jblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
        </defs>
        {/* radar rings: the heart "senses" the surroundings */}
        {radar > 0
          ? [0, 1, 2].map((i) => {
              const u = (t * 0.6 + i / 3) % 1;
              return <circle key={i} cx={hx} cy={hy - 10} r={180 + u * 330} fill="none" stroke={CYAN} strokeWidth={4} opacity={radar * (1 - u) * 0.7} />;
            })
          : null}
        {channel > 0 ? (
          <path d={new Array(41).fill(0).map((_, i) => (i ? 'L' : 'M') + path(i / 40).join(',')).join(' ')} fill="none" stroke="rgba(255,226,122,.35)"
            strokeWidth={10} strokeLinecap="round" opacity={channel} />
        ) : null}
        {sig}
        <Brain x={540} y={interpolate(e(T[1] - 0.3, 0.9), [0, 1], [400, 170]) - 40 * zoom} s={(1.7 - 0.7 * e(T[1] - 0.3, 0.9)) * (1 - 0.25 * zoom)} glow={brainGlow} op={brainOp * (t < T[1] ? spring({frame, fps, config: {damping: 14}}) : 1)} />
        {t < T[1] ? (
          <text x={790} y={300} fontFamily="Inter Display" fontWeight={900} fontSize={110} fill="url(#jgold)" opacity={sm(1.2, 1.8, t) * (1 - sm(3.8, 4.3, t))}
            transform={`rotate(${8 * Math.sin(t * 3)} 820 270)`}>?</text>
        ) : null}
        <Heart x={hx} y={hy} s={hs * heartIn} beat={beat} t={t} net={net * (1 - e(T[4] + 1))} mini={mini} op={Math.min(1, heartIn * 1.4)} alarm={alarm} />
        {/* "!" bubble: the heart is trying to tell you something */}
        {alarm > 0 ? (
          <g opacity={sm(T[6] + 2.3, T[6] + 2.8, t) * (1 - endK)} transform={`translate(${hx + 230},${hy - 210}) scale(${1 + 0.05 * beat})`}>
            <path d="M-80,-60 h160 a26,26 0 0 1 26,26 v70 a26,26 0 0 1 -26,26 h-110 l-40,36 l8,-36 h-18 a26,26 0 0 1 -26,-26 v-70 a26,26 0 0 1 26,-26 Z"
              fill="rgba(26,6,16,.9)" stroke="url(#jgold)" strokeWidth={5} />
            <text x={0} y={28} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={76} fill="url(#jgold)">
              {'.'.repeat(1 + (Math.floor(t * 3) % 3))}
            </text>
          </g>
        ) : null}
        {/* up / down arrows: much more goes heart -> brain */}
        {channel > 0 ? (
          <g opacity={channel * (1 - e(T[5]))} fontFamily="Inter Display" fontWeight={900}>
            <g transform="translate(250,400)">
              <path d="M0,-70 L46,-10 L18,-10 L18,70 L-18,70 L-18,-10 L-46,-10 Z" fill="url(#jgold)" />
              <text y={118} textAnchor="middle" fontSize={34} fill="#FFE9A0">BANYAK</text>
            </g>
            <g transform="translate(830,400)">
              <path d="M0,40 L26,8 L10,8 L10,-36 L-10,-36 L-10,8 L-26,8 Z" fill={CYAN} />
              <text y={118} textAnchor="middle" fontSize={34} fill={CYAN}>SEDIKIT</text>
            </g>
          </g>
        ) : null}
      </svg>
      <Title frame={frame} fps={fps} />
      {t < endT + 0.2 ? <StageLabel s={stages[si]} f={frame - Math.round(stages[si].t * fps)} fps={fps} t={t} out={labelOut} key={si} /> : null}
      {t >= endT ? <EndCard f={frame - endF} fps={fps} /> : null}
      <Captions words={words} y={1560} />
      <Ecg t={t} phase={phase} alarm={alarm} fast={fastT} />
    </AbsoluteFill>
  );
};
