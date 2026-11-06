import React from 'react';
import {AbsoluteFill, Easing, Freeze, OffthreadVideo, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp} from './Mukadimah';
import {Captions, Word} from './Captions';

// "Selamat Datang ke Dunia Quantum": vertical layout around a landscape zoom-into-hair clip.
// Top: fixed title. Middle: the clip (square crop) on a blurred copy of itself. Bottom: Malay stage label + powers-of-ten meter.

export type Stage = {t: number; name: string; size?: string; note: string; exp: number}; // exp = log10(size in metres)
export type QuantumProps = {src: string; stages: Stage[]; endT: number; titleTop: string; title: string; badge: string;
  words?: Word[]; captionY?: number; lastFrame?: number}; // lastFrame: freeze the clip there (VO runs longer than the clip)

const GOLD = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#B86A00 100%)';
const CYAN = '#38E1FF';
const SQ_TOP = 470;
const SQ = 1080;

const Particles: React.FC<{frame: number}> = ({frame}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    {new Array(60).fill(0).map((_, i) => {
      const x = random('px' + i) * 1080;
      const sp = 0.3 + random('ps' + i) * 0.8;
      const y = (random('py' + i) * 1920 - frame * sp * 2 + 1920 * 10) % 1920;
      const r = 1 + random('pr' + i) * 2.5;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (12 + random('pt' + i) * 20) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#BFF4FF' : '#FFE9A0'} opacity={0.5 * tw} />;
    })}
  </svg>
);

const Title: React.FC<{frame: number; fps: number; titleTop: string; title: string; badge: string}> = ({frame, fps, titleTop, title, badge}) => {
  const a = spring({frame: frame - 2, fps, config: {damping: 14}});
  const words = title.split(' ');
  const glow = 0.6 + 0.4 * Math.sin(frame / 18);
  const sweep = ((frame % 150) / 150) * 260 - 80;
  return (
    <div style={{position: 'absolute', top: 70, width: 1080, textAlign: 'center'}}>
      <div style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 30, letterSpacing: 7, color: CYAN,
        padding: '6px 20px', border: `2px solid ${CYAN}`, borderRadius: 30, background: 'rgba(2,10,24,.6)', opacity: a,
        boxShadow: `0 0 ${16 * glow}px rgba(56,225,255,.6)`}}>{badge}</div>
      <div style={{marginTop: 18, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 64, letterSpacing: 4, color: 'white',
        textShadow: '0 3px 14px rgba(0,0,0,.8)', opacity: a, transform: `translateY(${(1 - a) * -30}px)`}}>{titleTop}</div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 26, marginTop: 4}}>
        {words.map((w, i) => {
          const k = spring({frame: frame - 8 - i * 5, fps, config: {damping: 11, stiffness: 150}});
          return (
            <span key={i} style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 114, lineHeight: 1,
              letterSpacing: -2,
              backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${sweep - 10}%, rgba(255,255,255,.95) ${sweep}%, rgba(255,255,255,0) ${sweep + 10}%), ${GOLD}`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              filter: `drop-shadow(0 5px 0 #5A2E00) drop-shadow(0 0 ${20 + 14 * glow}px rgba(56,225,255,.55))`,
              opacity: k, transform: `translateY(${(1 - k) * 80}px) scale(${interpolate(k, [0, 1], [1.4, 1])})`}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// powers-of-ten meter: 10^0 m (left) -> 10^-15 m (right), dot glides between stages in log space
const Meter: React.FC<{exp: number}> = ({exp}) => {
  const x0 = 110;
  const x1 = 970;
  const p = Math.min(1, Math.max(0, -exp / 15));
  const x = x0 + (x1 - x0) * p;
  const ticks = [
    [0, '1 m'],
    [-3, '1 mm'],
    [-6, '1 µm'],
    [-9, '1 nm'],
    [-12, '1 pm'],
    [-15, '1 fm'],
  ] as const;
  return (
    <div style={{position: 'absolute', top: 1800, left: 0, width: 1080, height: 100}}>
      <svg width={1080} height={100}>
        <defs>
          <linearGradient id="mg" x1="0" x2="1">
            <stop offset="0" stopColor="#FFD45A" />
            <stop offset="1" stopColor={CYAN} />
          </linearGradient>
        </defs>
        <line x1={x0} x2={x1} y1={30} y2={30} stroke="rgba(255,255,255,.25)" strokeWidth={6} strokeLinecap="round" />
        <line x1={x0} x2={x} y1={30} y2={30} stroke="url(#mg)" strokeWidth={6} strokeLinecap="round" />
        {ticks.map(([e, l]) => {
          const tx = x0 + (x1 - x0) * (-e / 15);
          return (
            <g key={l}>
              <line x1={tx} x2={tx} y1={20} y2={40} stroke="rgba(255,255,255,.6)" strokeWidth={3} />
              <text x={tx} y={76} textAnchor="middle" fontFamily="Inter Display" fontWeight={700} fontSize={26} fill="rgba(255,255,255,.85)">
                {l}
              </text>
            </g>
          );
        })}
        <circle cx={x} cy={30} r={16} fill="#FFF6D0" stroke={CYAN} strokeWidth={4} style={{filter: `drop-shadow(0 0 12px ${CYAN})`}} />
      </svg>
    </div>
  );
};

const StageLabel: React.FC<{s: Stage; f: number; fps: number; idx: number; n: number; out: number}> = ({s, f, fps, idx, n, out}) => {
  const k = spring({frame: f, fps, config: {damping: 13, stiffness: 160}});
  const k2 = spring({frame: f - 6, fps, config: {damping: 14}});
  const chars = Math.floor(interpolate(f, [10, 10 + s.note.length * 0.9], [0, s.note.length], clamp));
  return (
    <div style={{position: 'absolute', top: 1572, width: 1080, textAlign: 'center', opacity: 1 - out,
      filter: `blur(${out * 10}px)`, transform: `translateY(${-out * 30}px)`}}>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, height: 112,
        opacity: k, filter: `blur(${(1 - k) * 12}px)`, transform: `translateY(${(1 - k) * 50}px)`}}>
        <span style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 28, color: 'rgba(255,255,255,.7)', letterSpacing: 2}}>
          {String(idx + 1).padStart(2, '0')}/{n}
        </span>
        <span style={{fontFamily: 'Inter Display', fontWeight: 900, fontSize: s.name.length > 10 ? 80 : 96, lineHeight: 1, backgroundImage: GOLD,
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 0 #5A2E00)'}}>{s.name}</span>
        {s.size ? (
          <span style={{fontFamily: 'Inter Display', fontWeight: 900, fontSize: 46, color: '#02131F', background: CYAN, borderRadius: 14,
            padding: '4px 16px', boxShadow: `0 0 22px ${CYAN}`, transform: `scale(${k2})`, display: 'inline-block'}}>{s.size}</span>
        ) : null}
      </div>
      <div style={{marginTop: 8, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 44, color: 'white', minHeight: 56,
        textShadow: '0 2px 12px rgba(0,0,0,.9)', padding: '0 50px'}}>
        {s.note.slice(0, chars)}
      </div>
    </div>
  );
};

const EndCard: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const k = spring({frame: f, fps, config: {damping: 13}});
  const k2 = spring({frame: f - 10, fps, config: {damping: 10, stiffness: 160}});
  return (
    <div style={{position: 'absolute', top: SQ_TOP + 320, left: 120, width: 840, height: 420, borderRadius: 40,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(18,48,92,.92), rgba(4,10,26,.94))', border: '3px solid rgba(255,200,70,.95)',
      boxShadow: '0 0 50px rgba(255,170,30,.5)', textAlign: 'center', opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.85, 1])})`}}>
      <div style={{marginTop: 54, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 38, letterSpacing: 6, color: '#FFE9A0'}}>BERGABUNG BERSAMA</div>
      <div style={{marginTop: 12, fontFamily: 'Inter Display', fontWeight: 900, fontSize: 112, lineHeight: 1, backgroundImage: GOLD,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 0 #5A2E00)'}}>KOMUNITI KAMI</div>
      <div style={{marginTop: 34, display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 64, color: 'white',
        background: '#E8312A', borderRadius: 18, padding: '6px 28px', transform: `scale(${k2})`, boxShadow: '0 0 30px #E8312A'}}>KLIK LINK BIO</div>
    </div>
  );
};

export const Quantum: React.FC<QuantumProps> = ({src, stages, endT, titleTop, title, badge, words, captionY = 1400, lastFrame = 1e9}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // current stage
  let si = 0;
  stages.forEach((s, i) => {
    if (t >= s.t) si = i;
  });
  // log-space glide of the meter between stage sizes
  const nxt = stages[Math.min(si + 1, stages.length - 1)];
  const cur = stages[si];
  const g = si + 1 < stages.length ? Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (t - cur.t) / Math.max(0.1, nxt.t - cur.t)))) : 0;
  const exp = cur.exp + (nxt.exp - cur.exp) * g;
  const flash = Math.max(0, ...stages.map((s) => interpolate(t, [s.t - 0.08, s.t, s.t + 0.3], [0, 0.35, 0], clamp)));
  const endF = Math.round(endT * fps);
  const labelOut = interpolate(frame, [endF - 6, endF + 4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: '#02060E', overflow: 'hidden'}}>
      {/* blurred copy fills the frame */}
      <AbsoluteFill style={{filter: 'blur(36px) brightness(.38) saturate(1.3)', transform: 'scale(1.25)'}}>
        <Freeze frame={lastFrame} active={(f) => f >= lastFrame}>
          <OffthreadVideo src={staticFile(src)} muted style={{width: 1080, height: 1920, objectFit: 'cover'}} />
        </Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,6,14,.75) 0%, rgba(2,6,14,0) 26%, rgba(2,6,14,0) 78%, rgba(2,6,14,.8) 100%)'}} />
      <Particles frame={frame} />
      {/* main clip: square crop */}
      <div style={{position: 'absolute', top: SQ_TOP, left: 0, width: SQ, height: SQ, overflow: 'hidden',
        boxShadow: `0 0 0 3px rgba(56,225,255,.55), 0 0 60px rgba(56,225,255,.35)`}}>
        <Freeze frame={lastFrame} active={(f) => f >= lastFrame}>
          <OffthreadVideo src={staticFile(src)} muted style={{width: SQ, height: SQ, objectFit: 'cover'}} />
        </Freeze>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(2,6,14,.55) 100%)'}} />
        <AbsoluteFill style={{background: 'white', opacity: flash}} />
      </div>
      <Title frame={frame} fps={fps} titleTop={titleTop} title={title} badge={badge} />
      {t < endT + 0.2 ? (
        <StageLabel s={cur} f={frame - Math.round(cur.t * fps)} fps={fps} idx={si} n={stages.length} out={labelOut} key={si} />
      ) : null}
      {words && t < endT + 0.1 ? <Captions words={words} y={captionY} /> : null}
      <Meter exp={exp} />
      {t >= endT ? <EndCard f={frame - endF} fps={fps} /> : null}
    </AbsoluteFill>
  );
};
