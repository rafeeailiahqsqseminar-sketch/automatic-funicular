import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp} from './Mukadimah';
import {Captions, Word} from './Captions';

// "Jantung: Radar Jiwa" - voice-over only. A glowing heart with its field radiating, stat cards from his own words, karaoke captions.

export type JCard = {t: number; d: number; top: string; big: string; sub?: string; bar?: number}; // bar = heart vs brain ratio
export type JantungProps = {audio: string; words: Word[]; badge: string; titleTop: string; title: string;
  cards: JCard[]; radarT: [number, number]; finalT: number; endT: number; broll?: {src: string; t: number; d: number}};

const GOLD = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#B86A00 100%)';
const RED = '#FF3B5C';
const CX = 540;
const CY = 820;

// lub-dub at ~66 bpm
const beat = (t: number) => {
  const p = (t % 0.91) / 0.91;
  const a = Math.exp(-Math.pow((p - 0.04) / 0.035, 2));
  const b = 0.6 * Math.exp(-Math.pow((p - 0.2) / 0.04, 2));
  return a + b;
};

const Particles: React.FC<{frame: number}> = ({frame}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    {new Array(70).fill(0).map((_, i) => {
      const x = random('jx' + i) * 1080;
      const sp = 0.3 + random('js' + i) * 0.8;
      const y = (random('jy' + i) * 1920 - frame * sp * 1.6 + 1920 * 10) % 1920;
      const r = 1 + random('jr' + i) * 2.4;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (12 + random('jt' + i) * 20) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#FFC2CC' : '#FFE9A0'} opacity={0.45 * tw} />;
    })}
  </svg>
);

const HEART = 'M0,-60 C-20,-110 -110,-105 -110,-35 C-110,25 -40,70 0,110 C40,70 110,25 110,-35 C110,-105 20,-110 0,-60 Z';

const HeartScene: React.FC<{t: number; frame: number; fieldOn: number; spread: number; radar: number}> = ({t, frame, fieldOn, spread, radar}) => {
  const b = beat(t);
  const s = 1.55 + 0.12 * b;
  // expanding waves, one per beat
  const waves = [0, 1, 2, 3].map((k) => {
    const p = ((t + k * 0.91) % 3.64) / 3.64;
    return {r: 130 + p * (260 + 300 * spread), o: (1 - p) * 0.55 * fieldOn};
  });
  const sweep = (t * 120) % 360;
  return (
    <svg width={1080} height={1080} viewBox="-540 -540 1080 1080" style={{position: 'absolute', left: CX - 540, top: CY - 540}}>
      <defs>
        <radialGradient id="hg" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFD0D8" />
          <stop offset=".35" stopColor="#FF4D6A" />
          <stop offset="1" stopColor="#8A0020" />
        </radialGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="rgba(255,70,100,.55)" />
          <stop offset="1" stopColor="rgba(255,70,100,0)" />
        </radialGradient>
        <linearGradient id="fl" x1="0" x2="1">
          <stop offset="0" stopColor="#FFD45A" />
          <stop offset=".5" stopColor="#FF7A90" />
          <stop offset="1" stopColor="#FFD45A" />
        </linearGradient>
        <radialGradient id="rd">
          <stop offset="0" stopColor="rgba(80,255,190,0)" />
          <stop offset="1" stopColor="rgba(80,255,190,.35)" />
        </radialGradient>
      </defs>
      <circle r={300 + 60 * b} fill="url(#glow)" />
      {/* dipole field lines (torus) */}
      {[1, 2, 3, 4, 5, 6].map((k) => {
        const w = (70 + k * 62) * (0.75 + 0.4 * spread);
        const h = 150 + k * 36;
        const dash = 14 + k * 3;
        const off = -frame * (1.6 + k * 0.25);
        const o = fieldOn * (0.75 - k * 0.08);
        return (
          <g key={k} opacity={o}>
            <path d={`M0,-30 C${w},-${h} ${w},${h} 0,40`} fill="none" stroke="url(#fl)" strokeWidth={3.2} strokeDasharray={`${dash} ${dash * 0.7}`} strokeDashoffset={off} />
            <path d={`M0,-30 C-${w},-${h} -${w},${h} 0,40`} fill="none" stroke="url(#fl)" strokeWidth={3.2} strokeDasharray={`${dash} ${dash * 0.7}`} strokeDashoffset={off} />
          </g>
        );
      })}
      {waves.map((w, i) => (
        <circle key={i} r={w.r} fill="none" stroke="#FFB3C0" strokeWidth={3} opacity={w.o} />
      ))}
      {/* radar */}
      {radar > 0 ? (
        <g opacity={radar}>
          {[180, 300, 420].map((r) => (
            <circle key={r} r={r} fill="none" stroke="rgba(80,255,190,.45)" strokeWidth={2} strokeDasharray="6 10" />
          ))}
          <line x1={-450} x2={450} y1={0} y2={0} stroke="rgba(80,255,190,.25)" strokeWidth={2} />
          <line y1={-450} y2={450} x1={0} x2={0} stroke="rgba(80,255,190,.25)" strokeWidth={2} />
          <g transform={`rotate(${sweep})`}>
            <path d="M0,0 L430,0 A430,430 0 0,0 372,-215 Z" fill="url(#rd)" />
            <line x1={0} y1={0} x2={430} y2={0} stroke="#5CFFC0" strokeWidth={4} style={{filter: 'drop-shadow(0 0 8px #5CFFC0)'}} />
          </g>
          {[[300, -40], [-250, 210], [140, 330], [-380, -160], [60, -400]].map(([x, y], i) => {
            const ang = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
            const since = ((sweep - ang + 360) % 360) / 360;
            const o = Math.max(0, 1 - since * 2.2);
            return <circle key={i} cx={x} cy={y} r={10 + 8 * o} fill="#9DFFDA" opacity={o} style={{filter: 'drop-shadow(0 0 10px #5CFFC0)'}} />;
          })}
        </g>
      ) : null}
      <g transform={`scale(${s})`} style={{filter: `drop-shadow(0 0 ${20 + 30 * b}px rgba(255,60,90,.9))`}}>
        <path d={HEART} fill="url(#hg)" stroke="#FFD45A" strokeWidth={3} />
        <path d="M-70,-50 C-70,-80 -40,-88 -25,-70" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={8} strokeLinecap="round" />
        {/* ECG line across the heart */}
        <path d="M-95,10 L-45,10 L-30,-25 L-12,50 L5,-55 L22,30 L35,10 L95,10" fill="none" stroke="#FFF6D0" strokeWidth={6}
          strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
      </g>
    </svg>
  );
};

const Title: React.FC<{frame: number; fps: number; badge: string; titleTop: string; title: string}> = ({frame, fps, badge, titleTop, title}) => {
  const a = spring({frame: frame - 2, fps, config: {damping: 14}});
  const words = title.split(' ');
  const glow = 0.6 + 0.4 * Math.sin(frame / 18);
  const sweep = ((frame % 150) / 150) * 260 - 80;
  return (
    <div style={{position: 'absolute', top: 80, width: 1080, textAlign: 'center'}}>
      <div style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 800, fontSize: 30, letterSpacing: 7, color: RED,
        padding: '6px 20px', border: `2px solid ${RED}`, borderRadius: 30, background: 'rgba(20,2,8,.6)', opacity: a,
        boxShadow: `0 0 ${16 * glow}px rgba(255,59,92,.6)`}}>{badge}</div>
      <div style={{marginTop: 18, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 58, letterSpacing: 4, color: 'white',
        textShadow: '0 3px 14px rgba(0,0,0,.8)', opacity: a, transform: `translateY(${(1 - a) * -30}px)`}}>{titleTop}</div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 26, marginTop: 4}}>
        {words.map((w, i) => {
          const k = spring({frame: frame - 8 - i * 5, fps, config: {damping: 11, stiffness: 150}});
          return (
            <span key={i} style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 120, lineHeight: 1, letterSpacing: -2,
              backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${sweep - 10}%, rgba(255,255,255,.95) ${sweep}%, rgba(255,255,255,0) ${sweep + 10}%), ${GOLD}`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              filter: `drop-shadow(0 5px 0 #5A2E00) drop-shadow(0 0 ${20 + 14 * glow}px rgba(255,59,92,.55))`,
              opacity: k, transform: `translateY(${(1 - k) * 80}px) scale(${interpolate(k, [0, 1], [1.4, 1])})`}}>{w}</span>
          );
        })}
      </div>
    </div>
  );
};

const Card: React.FC<{c: JCard; f: number; fps: number}> = ({c, f, fps}) => {
  const D = Math.round(c.d * fps);
  const k = spring({frame: f, fps, config: {damping: 13, stiffness: 160}});
  const out = interpolate(f, [D - 8, D], [0, 1], clamp);
  const chars = Math.floor(interpolate(f, [12, 12 + (c.sub || '').length * 0.8], [0, (c.sub || '').length], clamp));
  const num = c.big.match(/^([\d,]+)(.*)$/);
  let big = c.big;
  if (num) {
    const n = parseInt(num[1].replace(/,/g, ''), 10);
    const v = Math.round(n * Easing(interpolate(f, [4, 30], [0, 1], clamp)));
    big = v.toLocaleString('en-US') + num[2];
  }
  const barP = interpolate(f, [6, 34], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', top: 1170, width: 1080, textAlign: 'center', opacity: k * (1 - out),
      filter: `blur(${out * 10 + (1 - k) * 10}px)`, transform: `translateY(${(1 - k) * 50 - out * 30}px)`}}>
      <div style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 34, letterSpacing: 6, color: '#FFE9A0',
        textShadow: '0 2px 10px rgba(0,0,0,.9)'}}>{c.top}</div>
      <div style={{fontFamily: 'Inter Display', fontWeight: 900, fontSize: big.length > 12 ? 96 : 132, lineHeight: 1.05, backgroundImage: GOLD,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 5px 0 #5A2E00) drop-shadow(0 0 24px rgba(255,59,92,.5))'}}>{big}</div>
      {c.sub ? (
        <div style={{marginTop: 6, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 42, color: 'white', minHeight: 52,
          textShadow: '0 2px 12px rgba(0,0,0,.9)', padding: '0 60px'}}>{c.sub.slice(0, chars)}</div>
      ) : null}
      {c.bar ? (
        <div style={{margin: '14px auto 0', width: 760, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 28, color: 'white', textAlign: 'left'}}>
          {[['OTAK', 1, '#7FB8FF'], ['JANTUNG', c.bar, RED]].map(([l, v, col]) => (
            <div key={l as string} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 8}}>
              <span style={{width: 150, letterSpacing: 2}}>{l}</span>
              <div style={{flex: 1, height: 22, borderRadius: 11, background: 'rgba(255,255,255,.12)'}}>
                <div style={{height: 22, borderRadius: 11, background: col as string, boxShadow: `0 0 16px ${col}`,
                  width: `${Math.max(1.2, (100 * barP * Math.log10(1 + (v as number))) / Math.log10(1 + c.bar!))}%`}} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
const Easing = (x: number) => 1 - Math.pow(1 - x, 3);

const BRoll: React.FC<{src: string; d: number}> = ({src, d}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f, fps, config: {damping: 14}});
  const out = interpolate(f, [d * fps - 10, d * fps], [0, 1], clamp);
  const W = 430;
  const H = Math.round((W * 848) / 464);
  return (
    <div style={{position: 'absolute', left: CX - W / 2, top: 345, width: W, height: H, borderRadius: 34, overflow: 'hidden',
      border: '4px solid #FFD45A', boxShadow: `0 0 50px rgba(255,59,92,.7), 0 0 0 10px rgba(255,59,92,.18)`,
      opacity: k * (1 - out), transform: `scale(${interpolate(k, [0, 1], [0.8, 1]) * (1 + 0.04 * (f / (d * fps)))})`}}>
      <OffthreadVideo src={staticFile(src)} muted style={{width: W, height: H, objectFit: 'cover'}} />
    </div>
  );
};

const Final: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const k = spring({frame: f, fps, config: {damping: 12, stiffness: 140}});
  const k2 = spring({frame: f - 8, fps, config: {damping: 12, stiffness: 140}});
  return (
    <div style={{position: 'absolute', top: 1150, width: 1080, textAlign: 'center'}}>
      <div style={{fontFamily: 'Inter Display', fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: 'white', opacity: k,
        transform: `scale(${interpolate(k, [0, 1], [1.3, 1])})`, textShadow: '0 4px 20px rgba(0,0,0,.9)'}}>GERAK SEBELUM GERAK</div>
      <div style={{display: 'inline-block', marginTop: 16, fontFamily: 'Inter Display', fontWeight: 900, fontSize: 84, color: 'white',
        background: RED, borderRadius: 20, padding: '4px 30px', transform: `scale(${k2})`, boxShadow: `0 0 40px ${RED}`}}>RADAR JIWA ANDA</div>
    </div>
  );
};

const EndCard: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const k = spring({frame: f, fps, config: {damping: 13}});
  const k2 = spring({frame: f - 10, fps, config: {damping: 10, stiffness: 160}});
  return (
    <div style={{position: 'absolute', top: 1120, left: 120, width: 840, height: 380, borderRadius: 40,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(92,18,40,.92), rgba(20,4,12,.94))', border: '3px solid rgba(255,200,70,.95)',
      boxShadow: '0 0 50px rgba(255,170,30,.5)', textAlign: 'center', opacity: k, transform: `scale(${interpolate(k, [0, 1], [0.85, 1])})`}}>
      <div style={{marginTop: 50, fontFamily: 'Inter Display', fontWeight: 800, fontSize: 38, letterSpacing: 6, color: '#FFE9A0'}}>BERGABUNG BERSAMA</div>
      <div style={{marginTop: 10, fontFamily: 'Inter Display', fontWeight: 900, fontSize: 92, lineHeight: 1, whiteSpace: 'nowrap', backgroundImage: GOLD,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 0 #5A2E00)'}}>KOMUNITI KAMI</div>
      <div style={{marginTop: 30, display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 60, color: 'white',
        background: RED, borderRadius: 18, padding: '6px 28px', transform: `scale(${k2})`, boxShadow: `0 0 30px ${RED}`}}>KLIK LINK DI BIO</div>
    </div>
  );
};

export const Jantung: React.FC<JantungProps> = ({audio, words, badge, titleTop, title, cards, radarT, finalT, endT, broll}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const fieldOn = interpolate(t, [12.5, 14.5], [0.25, 1], clamp);
  const spread = interpolate(t, [25, 36], [0, 1], clamp);
  const radar = interpolate(t, [radarT[0], radarT[0] + 1, radarT[1] - 0.5, radarT[1] + 0.5], [0, 1, 1, 0], clamp);
  const push = interpolate(t, [0, endT], [1, 1.08], clamp);
  const flash = Math.max(0, ...cards.map((c) => interpolate(t, [c.t - 0.06, c.t, c.t + 0.3], [0, 0.22, 0], clamp)));
  const card = cards.find((c) => t >= c.t && t < c.t + c.d);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #3A0818 0%, #12040C 45%, #05020A 100%)', overflow: 'hidden'}}>
      <Audio src={staticFile(audio)} />
      <Particles frame={frame} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: `${CX}px ${CY}px`}}>
        <HeartScene t={t} frame={frame} fieldOn={fieldOn} spread={spread} radar={radar} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.6) 100%)'}} />
      {broll ? (
        <Sequence from={Math.round(broll.t * fps)} durationInFrames={Math.round(broll.d * fps)}>
          <BRoll src={broll.src} d={broll.d} />
        </Sequence>
      ) : null}
      <AbsoluteFill style={{background: 'white', opacity: flash}} />
      <Title frame={frame} fps={fps} badge={badge} titleTop={titleTop} title={title} />
      {card ? <Card c={card} f={frame - Math.round(card.t * fps)} fps={fps} key={card.t} />
        : t >= finalT && t < endT ? <Final f={frame - Math.round(finalT * fps)} fps={fps} /> : null}
      {t < endT ? <Captions words={words} y={1580} /> : null}
      {t >= endT ? <EndCard f={frame - Math.round(endT * fps)} fps={fps} /> : null}
    </AbsoluteFill>
  );
};
