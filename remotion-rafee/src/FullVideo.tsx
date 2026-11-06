import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, GoldDefs, HEART, SceneKewangan, Sparkles, TitleCard, clamp} from './Mukadimah';
import {Captions, Word} from './Captions';
import {AnimName, Ilustrasi} from './Ilustrasi';

export type Card = {t: number; d: number; top: string; title: string[]; sub?: string; hl?: string; accent?: string; anim?: AnimName};
export type Header = {top: string; title: string | string[]; y: number; fs?: number; stepLabel?: string; steps?: number[]; accent?: string};
export type FullVideoProps = {
  src: string; // footage in public/
  scene: 'maaf' | 'kewangan' | 'none';
  sceneY: number;
  zoomY?: number; // y the camera zooms around (keep the top of his head still when cards sit above it)
  cuts?: number[]; // jump-cut points (s): alternate framing 1.0 / 1.06 so cuts look intentional
  words?: Word[]; // karaoke captions (when the footage has no burned captions)
  captionY?: number;
  header?: Header; // stays above the head whenever no card is on screen
  animY?: number; // centre of the card animations
  srcBox?: [number, number, number]; // source width, height, black rows on top to hide (CapCut export)
  coverText?: string; // big pill on the chest (cover photo)
  fg?: string; // person cutout with alpha (tools/person_matte.py): header goes BEHIND the head
  cardY: number;
  intro: Card; // title card after the illustration
  cards: Card[];
};

// ---------- scene 'maaf': gold heart cracks red, splits, then gold light seals it (kintsugi) ----------
const CRACK: [number, number][] = [
  [0, -34], [-12, -14], [10, 4], [-10, 24], [8, 44], [-4, 60], [0, 72],
];
const SceneMaaf: React.FC<{f: number; fps: number; cy: number}> = ({f, fps, cy}) => {
  const pop = spring({frame: f, fps, config: {damping: 10, stiffness: 150}});
  const crack = interpolate(f, [12, 22], [0, 1], clamp);
  const split = interpolate(f, [18, 28], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) *
    (1 - interpolate(f, [42, 54], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}));
  const heal = interpolate(f, [44, 60], [0, 1], clamp);
  const shake = f > 14 && f < 28 ? Math.sin(f * 2.4) * 8 * (1 - (f - 14) / 14) : 0;
  const beat = f > 58 ? 1 + 0.08 * Math.max(0, Math.sin(((f - 58) / fps) * Math.PI * 4)) : 1;
  const S = 2.2 * pop * beat;
  const crackPts = CRACK.map(([x, y]) => `${x},${y}`).join(' ');
  const n = CRACK.length - 1;
  const len = 160;
  const halves = [-1, 1].map((side) => {
    const poly = `${side * 120},-90 ${crackPts} ${side * 120},90`;
    return {side, poly};
  });
  const seamCol = heal > 0.3 ? '#FFE9A0' : '#FF3B30';
  return (
    <g transform={`translate(${540 + shake},${cy - 20})`}>
      <defs>
        {halves.map(({side, poly}) => (
          <clipPath id={`half${side}`} key={side}>
            <polygon points={poly} />
          </clipPath>
        ))}
      </defs>
      {heal > 0 ? <circle r={260} fill="url(#halo)" opacity={heal} /> : null}
      <g transform={`scale(${S})`}>
        {halves.map(({side}) => (
          <g key={side} transform={`translate(${side * split * 16},${split * 4}) rotate(${side * split * 7})`} clipPath={`url(#half${side})`}>
            <path d={HEART} fill="url(#gold)" stroke="#3C1C00" strokeWidth={2.5} filter="url(#glow)" />
            <ellipse cx={-34} cy={-26} rx={12} ry={7} fill="rgba(255,255,240,.6)" transform="rotate(-35 -34 -26)" />
          </g>
        ))}
        {crack > 0 ? (
          <polyline
            points={crackPts}
            fill="none"
            stroke={seamCol}
            strokeWidth={3 + 2.5 * heal}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - crack)}
            opacity={1 - split * 0.4}
            filter="url(#glow)"
          />
        ) : null}
      </g>
      {/* healing light threads flying into the crack */}
      {heal > 0 && heal < 1
        ? new Array(8).fill(0).map((_, i) => {
            const side = i % 2 ? 1 : -1;
            const sx = side * 430;
            const sy = -150 + i * 40;
            const [tx, ty] = CRACK[i % (n + 1)].map((v) => v * S) as [number, number];
            const k = Easing.out(Easing.cubic)(Math.min(1, heal * 1.4));
            const px = sx + (tx - sx) * k;
            const py = sy + (ty - sy) * k;
            return (
              <g key={i} opacity={1 - heal}>
                <path d={`M${sx},${sy} Q${(sx + px) / 2},${sy - 60} ${px},${py}`} stroke="#FFE08A" strokeWidth={3} fill="none" />
                <circle cx={px} cy={py} r={8} fill="#FFF6D0" filter="url(#glow)" />
              </g>
            );
          })
        : null}
      {/* small red shards when it breaks */}
      {f > 18 && f < 44
        ? new Array(10).fill(0).map((_, i) => {
            const k = (f - 18) / fps;
            const x = (random('sx' + i) - 0.5) * 60 + (random('svx' + i) - 0.5) * 500 * k;
            const y = (random('sy' + i) - 0.5) * 120 - 250 * k + 900 * k * k;
            return <rect key={i} x={x} y={y} width={12} height={8} fill="#FF6B5A" opacity={interpolate(k, [0, 0.8], [1, 0], clamp)} transform={`rotate(${k * 300 * (random('sr' + i) - 0.5)} ${x} ${y})`} />;
          })
        : null}
    </g>
  );
};

// ---------- persistent header: badge + step tracker, then the BIG 2-line title (behind the head when fg is set) ----------
const HeaderBar: React.FC<{h: Header; frame: number; fps: number; vis: number}> = ({h, frame, fps, vis}) => {
  const t = frame / fps;
  const acc = h.accent ?? '#E8312A';
  const steps = h.steps ?? [];
  const cur = steps.filter((s) => t >= s).length;
  const lines = Array.isArray(h.title) ? h.title : [h.title];
  const fs = h.fs ?? 150;
  const goldBg = 'linear-gradient(180deg,#FFF6C8 0%,#FFD45A 38%,#F2B023 70%,#B86A00 100%)';
  const top = h.y - fs / 2 - (lines.length - 1) * fs * 0.98 - 96; // h.y = centre of the LAST line
  return (
    <AbsoluteFill style={{opacity: vis, transform: `translateY(${(1 - vis) * -30}px)`}}>
      <Backdrop y={h.y - fs * 0.4} h={560} o={0.6} />
      <div style={{position: 'absolute', top, width: 1080, textAlign: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, height: 70}}>
          <div style={{fontFamily: 'Inter Display', fontWeight: 800, fontSize: 30, letterSpacing: 5, color: '#FFE9A0',
            padding: '6px 18px', border: '2px solid rgba(255,212,90,.85)', borderRadius: 30, background: 'rgba(4,14,36,.6)'}}>{h.top}</div>
          {steps.map((s, i) => {
            const on = i < cur;
            const now = i === cur - 1;
            const k = spring({frame: frame - Math.round(s * fps), fps, config: {damping: 9}});
            const pulse = now ? 1 + 0.06 * Math.sin(frame / 5) : 1;
            return (
              <div key={i} style={{width: 54, height: 54, borderRadius: 27, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter Display', fontWeight: 900, fontSize: 32,
                background: on ? acc : 'rgba(4,14,36,.6)', color: on ? 'white' : 'rgba(255,233,160,.8)',
                border: `3px solid ${on ? '#FFE9A0' : 'rgba(255,212,90,.6)'}`,
                boxShadow: on ? `0 0 ${18 * k}px ${acc}` : 'none', transform: `scale(${(on ? interpolate(k, [0, 1], [0.6, 1]) : 1) * pulse})`}}>
                {i + 1}
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 26, fontFamily: 'Inter Display', fontWeight: 900, fontSize: fs, lineHeight: 0.98, letterSpacing: -2,
          backgroundImage: goldBg, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          filter: 'drop-shadow(0 5px 0 #5A2E00) drop-shadow(0 0 22px rgba(255,170,30,.5))'}}>
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SCENE_T0 = 0.15;
const SCENE_T1 = 2.6;

export const FullVideo: React.FC<FullVideoProps> = ({src, scene, sceneY, cardY, intro, cards, zoomY = 700, cuts = [], words, captionY = 1480, header, fg, coverText, animY = 680, srcBox}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vStyle: React.CSSProperties = srcBox
    ? (() => {
        const [sw, sh, top] = srcBox;
        const k = 1920 / (sh - top);
        return {position: 'absolute', width: sw * k, height: sh * k, top: -top * k, left: (1080 - sw * k) / 2};
      })()
    : {width: 1080, height: 1920, objectFit: 'cover'};
  const s0 = Math.round(SCENE_T0 * fps);
  const s1 = Math.round(SCENE_T1 * fps);
  const all = [intro, ...cards];
  const win = all.map((c) => [Math.round(c.t * fps), Math.round((c.t + c.d) * fps)] as const);

  // camera: slow push-in under the intro, a punch on every card, ease back after
  const seg = cuts.filter((c) => frame / fps >= c).length;
  let zoom = seg % 2 ? 1.07 : 1;
  const introPush = interpolate(frame, [0, win[0][0]], [0, 0.06], {...clamp, easing: Easing.out(Easing.quad)});
  const introBack = interpolate(frame, [win[0][1] - 10, win[0][1] + 12], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  zoom += introPush * introBack;
  win.forEach(([a, b]) => {
    const kick = spring({frame: frame - a, fps, config: {damping: 10, stiffness: 200}});
    const back = interpolate(frame, [b - 10, b + 12], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
    zoom += (frame >= a ? 0.05 * kick : 0) * back;
  });
  const active = (frame >= s0 && frame <= s1) || win.some(([a, b]) => frame >= a && frame <= b);
  const vig = Math.max(
    interpolate(frame, [0, 6, s1, s1 + 1], [0, 1, 1, 1], clamp) * (frame <= win[0][1] + 6 ? 1 : 0),
    ...win.map(([a, b]) => interpolate(frame, [a - 4, a + 4, b - 4, b + 6], [0, 1, 1, 0], clamp)),
  );
  const flash = Math.max(...win.map(([a]) => interpolate(frame, [a - 2, a, a + 6], [0, 0.7, 0], clamp)));
  const busy = (fr: number) => (scene !== 'none' && fr <= win[0][1]) || win.some(([a, b]) => fr >= a - 6 && fr <= b + 6);
  let hv = 0;
  for (let d = -8; d <= 8; d++) hv += busy(frame + d) ? 0 : 1;
  const headerVis = header ? Easing.inOut(Easing.cubic)(hv / 17) : 0;
  const headerEl = headerVis > 0 && header ? <HeaderBar h={header} frame={frame} fps={fps} vis={headerVis} /> : null;
  const sceneA = interpolate(frame, [s0, s0 + 8, s1 - 8, s1], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `540px ${zoomY}px`}}>
        <OffthreadVideo src={staticFile(src)} muted style={vStyle} />
        {fg ? headerEl : null}
        {fg && headerVis > 0 ? (
          <AbsoluteFill>
            <OffthreadVideo src={staticFile(fg)} muted transparent style={vStyle} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill
        style={{opacity: active ? vig : 0, background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,8,22,.6) 100%)'}}
      />
      {scene !== 'none' && frame >= s0 && frame <= s1 ? (
        <AbsoluteFill style={{opacity: sceneA}}>
          <Backdrop y={sceneY} h={640} o={0.85} />
          <svg width={1080} height={1920} style={{position: 'absolute'}}>
            <GoldDefs />
            <defs>
              <radialGradient id="halo">
                <stop offset="0" stopColor="rgba(255,205,100,.55)" />
                <stop offset="1" stopColor="rgba(255,170,40,0)" />
              </radialGradient>
            </defs>
            {scene === 'maaf' ? (
              <SceneMaaf f={frame - s0} fps={fps} cy={sceneY} />
            ) : (
              <g transform={`translate(540 ${sceneY}) scale(1.15) translate(-540 ${-sceneY})`}>
                <SceneKewangan f={frame - s0} fps={fps} cy={sceneY} />
              </g>
            )}
            <Sparkles f={frame - s0} cy={sceneY} seed={scene} />
          </svg>
        </AbsoluteFill>
      ) : null}
      {fg ? null : headerEl}
      {all.map((c, i) => {
        const [a, b] = win[i];
        if (!c.anim || frame < a || frame > b) return null;
        return <Ilustrasi key={'il' + i} name={c.anim} f={frame - a} fps={fps} dur={b - a} x={540} y={animY} scale={1.15} />;
      })}
      {words ? <Captions words={words} y={captionY} /> : null}
      {all.map((c, i) => {
        const [a, b] = win[i];
        if (frame < a || frame > b) return null;
        const last = c.title[c.title.length - 1].split(' ').slice(-1)[0];
        return (
          <TitleCard
            key={i}
            f={frame - a}
            fps={fps}
            dur={b - a}
            y={cardY}
            top={c.top}
            title={c.title}
            sub={c.sub ?? ''}
            hl={c.hl ?? last}
            accent={c.accent ?? '#FF3D6E'}
          />
        );
      })}
      <AbsoluteFill
        style={{opacity: flash, background: 'radial-gradient(circle at 50% 62%, rgba(255,240,190,1) 0%, rgba(255,200,90,.45) 35%, rgba(255,200,90,0) 70%)'}}
      />
      {coverText ? (
        <div style={{position: 'absolute', top: 1380, width: 1080, textAlign: 'center'}}>
          <span style={{display: 'inline-block', fontFamily: 'Inter Display', fontWeight: 900, fontSize: 74, color: 'white', lineHeight: 1.15,
            background: header?.accent ?? '#E8312A', borderRadius: 22, padding: '14px 34px', maxWidth: 940,
            boxShadow: `0 0 40px ${header?.accent ?? '#E8312A'}, 0 8px 0 rgba(0,0,0,.35)`, transform: 'rotate(-2deg)'}}>{coverText}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
