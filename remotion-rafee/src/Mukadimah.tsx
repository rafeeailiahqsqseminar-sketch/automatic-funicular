import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';

export type MukadimahProps = {
  scene: 'cinta' | 'kewangan';
  bg: string; // file in public/, '' = transparent
  top: string;
  title: string[];
  sub: string;
  sceneY?: number; // centre of the illustration (chest zone)
  cardY?: number; // centre of the title card
  hl?: string; // word on a coloured highlight box (default: last word)
  accent?: string; // highlight box colour
};

// Timing in seconds (same as the gaya baru skill: intro 0.15–2.6 s, title 2.45 s for 2.9 s)
const SCENE_T0 = 0.15;
const SCENE_T1 = 2.6;
const CARD_T0 = 2.45;
const CARD_T1 = 5.35;

const GOLD = ['#FFF6C8', '#FFD45A', '#F2B023', '#B86A00'];
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const GoldDefs: React.FC = () => (
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={GOLD[0]} />
      <stop offset=".35" stopColor={GOLD[1]} />
      <stop offset=".7" stopColor={GOLD[2]} />
      <stop offset="1" stopColor={GOLD[3]} />
    </linearGradient>
    <linearGradient id="pink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFE1EC" />
      <stop offset="1" stopColor="#F27AA5" />
    </linearGradient>
    <radialGradient id="heart" cx=".4" cy=".35" r=".8">
      <stop offset="0" stopColor="#FFD0D0" />
      <stop offset=".45" stopColor="#FF4D6D" />
      <stop offset="1" stopColor="#B0123A" />
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export const HEART = 'M0,-30 C-12,-66 -80,-52 -76,-10 C-72,22 -26,42 0,70 C26,42 72,22 76,-10 C80,-52 12,-66 0,-30 Z';

// ---------- soft navy glow so gold reads on a white shirt / bright wall ----------
export const Backdrop: React.FC<{y: number; h: number; o: number}> = ({y, h, o}) => (
  <div
    style={{
      position: 'absolute',
      left: -100,
      width: 1280,
      top: y - h / 2,
      height: h,
      opacity: o,
      background: 'radial-gradient(ellipse at center, rgba(4,14,36,.72) 0%, rgba(4,14,36,.45) 40%, rgba(4,14,36,0) 70%)',
    }}
  />
);

// ---------- sparkles ----------
export const Sparkles: React.FC<{f: number; cy: number; seed: string; n?: number; spread?: number}> = ({f, cy, seed, n = 40, spread = 460}) => (
  <g>
    {new Array(n).fill(0).map((_, i) => {
      const x = 540 + (random(seed + 'x' + i) - 0.5) * spread * 2;
      const y = cy + (random(seed + 'y' + i) - 0.5) * 300 - f * (1 + random(seed + 'v' + i) * 2);
      const d = random(seed + 'd' + i) * 20;
      const a = interpolate(f - d, [0, 6, 26], [0, 1, 0], clamp);
      const s = 4 + random(seed + 's' + i) * 8;
      const c = random(seed + 'c' + i) > 0.75 ? '#FF9DB5' : '#FFE9A0';
      return (
        <path
          key={i}
          d={`M${x},${y - s} L${x + s * 0.25},${y - s * 0.25} L${x + s},${y} L${x + s * 0.25},${y + s * 0.25} L${x},${y + s} L${x - s * 0.25},${y + s * 0.25} L${x - s},${y} L${x - s * 0.25},${y - s * 0.25} Z`}
          fill={c}
          opacity={a}
        />
      );
    })}
  </g>
);

// ---------- figures ----------
const Man: React.FC<{x: number; y: number; lean: number}> = ({x, y, lean}) => (
  <g transform={`translate(${x},${y}) rotate(${lean})`} filter="url(#glow)">
    <rect x={-34} y={-120} width={68} height={130} rx={28} fill="url(#gold)" stroke="#3C1C00" strokeWidth={4} />
    <circle cx={0} cy={-158} r={34} fill="url(#gold)" stroke="#3C1C00" strokeWidth={4} />
    <path d="M-34,-164 A34,34 0 0 1 34,-164 Q20,-178 0,-176 Q-22,-178 -34,-164 Z" fill="#3C1C00" />
  </g>
);
const Woman: React.FC<{x: number; y: number; lean: number}> = ({x, y, lean}) => (
  <g transform={`translate(${x},${y}) rotate(${lean})`} filter="url(#glow)">
    <path d="M-30,-118 Q0,-130 30,-118 L52,10 L-52,10 Z" fill="url(#pink)" stroke="#7A2140" strokeWidth={4} />
    <path d="M-40,-150 Q-40,-200 0,-200 Q40,-200 40,-150 L46,-108 Q0,-92 -46,-108 Z" fill="url(#pink)" stroke="#7A2140" strokeWidth={4} />
    <ellipse cx={0} cy={-152} rx={22} ry={26} fill="#FFE4C4" />
  </g>
);

// ---------- scene: cinta ----------
const SceneCinta: React.FC<{f: number; fps: number; cy: number}> = ({f, fps, cy}) => {
  const inL = spring({frame: f, fps, config: {damping: 14}});
  const ground = cy + 150;
  const mx = interpolate(inL, [0, 1], [120, 330]);
  const wx = interpolate(inL, [0, 1], [960, 750]);
  const lean = interpolate(f, [45, 62], [0, 6], {...clamp, easing: Easing.out(Easing.cubic)});
  // threads of light from each chest to the centre
  const thread = interpolate(f, [12, 34], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const hx = 540;
  const hy = cy - 40;
  const pop = spring({frame: f - 32, fps, config: {damping: 9, stiffness: 160}});
  const beat = 1 + 0.07 * Math.max(0, Math.sin(((f - 40) / fps) * Math.PI * 4)) * (f > 40 ? 1 : 0);
  const L = 330;
  const pathL = `M${mx + 20},${ground - 90} Q${(mx + hx) / 2},${hy - 140} ${hx},${hy}`;
  const pathR = `M${wx - 20},${ground - 90} Q${(wx + hx) / 2},${hy - 140} ${hx},${hy}`;
  return (
    <g>
      {[pathL, pathR].map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#FFD45A"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={L * 2}
          strokeDashoffset={L * 2 * (1 - thread)}
          opacity={interpolate(f, [34, 46], [1, 0.35], clamp)}
          filter="url(#glow)"
        />
      ))}
      <Man x={mx} y={ground} lean={lean} />
      <Woman x={wx} y={ground} lean={-lean} />
      <g transform={`translate(${hx},${hy}) scale(${pop * beat * 1.15})`} filter="url(#glow)">
        <path d={HEART} fill="url(#heart)" stroke="#FFE9A0" strokeWidth={6} />
        <ellipse cx={-34} cy={-26} rx={14} ry={8} fill="rgba(255,255,255,.6)" transform="rotate(-35 -34 -26)" />
      </g>
      {/* small hearts floating up */}
      {new Array(7).fill(0).map((_, i) => {
        const k = f - 42 - i * 3;
        if (k < 0) return null;
        const x = hx + (random('hx' + i) - 0.5) * 520;
        const y = hy + 40 - k * (5 + random('hv' + i) * 4);
        const a = interpolate(k, [0, 5, 28], [0, 1, 0], clamp);
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${0.22 + random('hs' + i) * 0.15})`} opacity={a}>
            <path d={HEART} fill="#FF7A95" />
          </g>
        );
      })}
    </g>
  );
};

// ---------- scene: kewangan ----------
const fmtRM = (n: number) => 'RM ' + Math.round(n).toLocaleString('en-US');
const SceneKewangan: React.FC<{f: number; fps: number; cy: number}> = ({f, fps, cy}) => {
  const base = cy + 150;
  const H = [90, 140, 185, 240, 300];
  const crash = spring({frame: f - 40, fps, config: {damping: 12}});
  const shake = f > 40 && f < 54 ? Math.sin(f * 2.6) * 9 * (1 - (f - 40) / 14) : 0;
  const up = interpolate(f, [4, 36], [0, 10000], {...clamp, easing: Easing.out(Easing.cubic)});
  const money = Math.max(0, f < 40 ? up : interpolate(crash, [0, 1], [10000, 120]));
  const red = interpolate(f, [40, 46], [0, 1], clamp);
  const numColor = red > 0.5 ? '#FF5A4A' : '#FFD45A';
  return (
    <g transform={`translate(${shake},0)`}>
      <line x1={250} x2={830} y1={base} y2={base} stroke="rgba(255,233,160,.7)" strokeWidth={4} strokeLinecap="round" />
      {H.map((h, i) => {
        const rise = spring({frame: f - 4 - i * 4, fps, config: {damping: 13}});
        const hh = h * rise * interpolate(crash, [0, 1], [1, 0.18 + i * 0.02]);
        const x = 290 + i * 105;
        return (
          <g key={i} filter="url(#glow)">
            <rect x={x} y={base - hh} width={74} height={hh} rx={10} fill={red > 0.5 ? '#E8463A' : 'url(#gold)'} stroke="#3C1C00" strokeWidth={4} />
          </g>
        );
      })}
      {/* coins falling after the crash */}
      {new Array(12).fill(0).map((_, i) => {
        const k = (f - 42 - random('cd' + i) * 8) / fps;
        if (k < 0) return null;
        const x = 300 + random('cx' + i) * 480 + (random('cvx' + i) - 0.5) * 300 * k;
        const y = base - 260 + random('cy' + i) * 60 - 260 * k + 1300 * k * k;
        return (
          <g key={i} opacity={interpolate(k, [0, 0.8], [1, 0], clamp)}>
            <ellipse cx={x} cy={y} rx={22} ry={22 * Math.abs(Math.cos(k * 9 + i))+3} fill="url(#gold)" stroke="#3C1C00" strokeWidth={3} />
          </g>
        );
      })}
      {/* flying RM note with wings: duit terbang */}
      {f > 44 &&
        (() => {
          const k = (f - 44) / fps;
          const x = 540 + 330 * k;
          const y = cy - 60 - 300 * k;
          const flap = Math.sin(f * 1.4) * 22;
          return (
            <g transform={`translate(${x},${y}) rotate(-12)`} opacity={interpolate(k, [0, 0.15, 0.85, 1.1], [0, 1, 1, 0], clamp)}>
              <ellipse cx={-30} cy={-26} rx={36} ry={14} fill="#FFF6E0" transform={`rotate(${-30 - flap} -10 -20)`} />
              <ellipse cx={30} cy={-26} rx={36} ry={14} fill="#FFF6E0" transform={`rotate(${30 + flap} 10 -20)`} />
              <rect x={-52} y={-26} width={104} height={52} rx={8} fill="url(#gold)" stroke="#3C1C00" strokeWidth={3} />
              <text x={0} y={10} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={28} fill="#3C1C00">
                RM
              </text>
            </g>
          );
        })()}
      <text
        x={540}
        y={cy - 175}
        textAnchor="middle"
        fontFamily="Inter Display"
        fontWeight={900}
        fontSize={92}
        fill={numColor}
        stroke="#3C1C00"
        strokeWidth={3}
        paintOrder="stroke"
        filter="url(#glow)"
      >
        {fmtRM(money)}
      </text>
    </g>
  );
};

// ---------- title card: kinetic words, highlight box, typewriter sub ----------
export const TitleCard: React.FC<{
  f: number; fps: number; dur: number; y: number; top: string; title: string[]; sub: string; hl: string; accent: string;
}> = ({f, fps, dur, y, top, title, sub, hl, accent}) => {
  const out = interpolate(f, [dur - 9, dur], [0, 1], clamp);
  const fs = 104;
  const lineH = fs * 1.12;
  const h = 70 + title.length * lineH + 70;
  const y0 = y - h / 2;
  const goldBg = `linear-gradient(180deg, ${GOLD[0]} 0%, ${GOLD[1]} 38%, ${GOLD[2]} 70%, ${GOLD[3]} 100%)`;
  const lineGrow = spring({frame: f, fps, config: {damping: 20}});
  const chars = Math.floor(interpolate(f, [16, 40], [0, sub.length], clamp));
  let wi = 0;
  return (
    <AbsoluteFill style={{opacity: 1 - out, filter: `blur(${out * 12}px)`, transform: `translateY(${-out * 40}px)`}}>
      <Backdrop y={y} h={h + 300} o={interpolate(f, [0, 6], [0, 1], clamp)} />
      <div style={{position: 'absolute', top: y0, width: 1080, textAlign: 'center'}}>
        {/* label with gold lines growing out to the sides */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, height: 56}}>
          <div style={{height: 4, width: 120 * lineGrow, background: 'linear-gradient(90deg, rgba(255,212,90,0), #FFD45A)'}} />
          <div
            style={{
              fontFamily: 'Inter Display', fontWeight: 800, fontSize: 36, letterSpacing: 7, color: '#FFE9A0',
              padding: '6px 22px', border: '3px solid rgba(255,212,90,.9)', borderRadius: 40, background: 'rgba(4,14,36,.55)',
              opacity: lineGrow, transform: `scale(${interpolate(lineGrow, [0, 1], [0.7, 1])})`,
            }}
          >
            {top}
          </div>
          <div style={{height: 4, width: 120 * lineGrow, background: 'linear-gradient(90deg, #FFD45A, rgba(255,212,90,0))'}} />
        </div>
        {/* words, one by one, blur-in */}
        <div style={{marginTop: 14}}>
          {title.map((line, li) => (
            <div key={li} style={{height: lineH, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26}}>
              {line.split(' ').map((w) => {
                const i = wi++;
                const k = spring({frame: f - 3 - i * 3, fps, config: {damping: 12, stiffness: 170}});
                const isHl = w.replace(/[?!.,]/g, '') === hl.replace(/[?!.,]/g, '');
                const box = spring({frame: f - 3 - i * 3 - 4, fps, config: {damping: 16}});
                return (
                  <div
                    key={i}
                    style={{
                      position: 'relative', display: 'inline-block',
                      opacity: k, filter: `blur(${(1 - k) * 14}px)`,
                      transform: `translateY(${(1 - k) * 70}px) scale(${interpolate(k, [0, 1], [1.35, 1])})`,
                    }}
                  >
                    {isHl ? (
                      <div
                        style={{
                          position: 'absolute', left: -16, right: -16, top: 6, bottom: 2, background: accent, borderRadius: 14,
                          transform: `scaleX(${box}) rotate(-2deg)`, transformOrigin: 'left center',
                          boxShadow: `0 0 30px ${accent}, 0 6px 0 rgba(0,0,0,.35)`,
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        position: 'relative', fontFamily: 'Inter Display', fontWeight: 900, fontSize: fs, lineHeight: 1,
                        ...(isHl
                          ? {color: 'white', textShadow: '0 4px 0 rgba(0,0,0,.35)'}
                          : {
                              backgroundImage: goldBg, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                              filter: 'drop-shadow(0 4px 0 #5A2E00) drop-shadow(0 0 16px rgba(255,170,30,.5))',
                            }),
                      }}
                    >
                      {w}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* typewriter sub */}
        <div
          style={{
            marginTop: 18, fontFamily: 'Inter Display', fontWeight: 600, fontSize: 46, color: 'white',
            textShadow: '0 2px 12px rgba(0,0,0,.9)', minHeight: 56,
          }}
        >
          {sub.slice(0, chars)}
          <span style={{opacity: chars < sub.length && f % 10 < 6 ? 1 : 0, color: '#FFD45A'}}>|</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Mukadimah: React.FC<MukadimahProps> = ({
  scene, bg, top, title, sub, sceneY = 1060, cardY = 1270, hl, accent = '#E8312A',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s0 = Math.round(SCENE_T0 * fps);
  const s1 = Math.round(SCENE_T1 * fps);
  const c0 = Math.round(CARD_T0 * fps);
  const c1 = Math.round(CARD_T1 * fps);
  const sf = frame - s0;
  const sceneA = interpolate(frame, [s0, s0 + 8, s1 - 8, s1], [0, 1, 1, 0], clamp);
  const lastWord = title[title.length - 1].split(' ').slice(-1)[0];
  // camera: slow push-in during the scene, a punch on the title, ease back to normal
  const kick = spring({frame: frame - c0, fps, config: {damping: 10, stiffness: 200}});
  const settle = interpolate(frame, [c1 - 10, c1 + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const zoom =
    1 + interpolate(frame, [0, c0], [0, 0.07], {...clamp, easing: Easing.out(Easing.quad)}) + 0.05 * kick * (frame >= c0 ? 1 : 0);
  const camScale = interpolate(settle, [0, 1], [zoom, 1]);
  const flash = interpolate(frame, [c0 - 2, c0, c0 + 6], [0, 0.85, 0], clamp);
  const vig = interpolate(frame, [0, 6, c1 - 6, c1 + 6], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: bg ? 'black' : 'transparent', overflow: 'hidden'}}>
      {bg ? (
        <AbsoluteFill style={{transform: `scale(${camScale})`, transformOrigin: '540px 760px'}}>
          <OffthreadVideo src={staticFile(bg)} style={{width: 1080, height: 1920}} />
        </AbsoluteFill>
      ) : null}
      {/* cinematic vignette while graphics are on */}
      <AbsoluteFill
        style={{opacity: vig, background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,8,22,.65) 100%)'}}
      />
      {frame >= s0 && frame <= s1 ? (
        <AbsoluteFill style={{opacity: sceneA}}>
          <Backdrop y={sceneY} h={720} o={0.85} />
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <GoldDefs />
            <g transform={`translate(540 ${sceneY}) scale(1.3) translate(-540 ${-sceneY})`}>
              {scene === 'cinta' ? <SceneCinta f={sf} fps={fps} cy={sceneY} /> : <SceneKewangan f={sf} fps={fps} cy={sceneY} />}
            </g>
            <Sparkles f={sf} cy={sceneY} seed={scene} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {frame >= c0 && frame <= c1 ? (
        <TitleCard
          f={frame - c0} fps={fps} dur={c1 - c0} y={cardY} top={top} title={title} sub={sub} hl={hl ?? lastWord} accent={accent}
        />
      ) : null}
      {/* gold light flash between illustration and title */}
      <AbsoluteFill
        style={{opacity: flash, background: 'radial-gradient(circle at 50% 62%, rgba(255,240,190,1) 0%, rgba(255,200,90,.5) 35%, rgba(255,200,90,0) 70%)'}}
      />
    </AbsoluteFill>
  );
};
