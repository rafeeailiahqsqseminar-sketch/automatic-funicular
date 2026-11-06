import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type Word = {w: string; s: number; e: number};

// Group words into short chunks (max 3 words / 18 chars, break after punctuation)
export const chunkWords = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const len = cur.map((x) => x.w).join(' ').length + w.w.length;
    const gap = cur.length ? w.s - cur[cur.length - 1].e : 0;
    if (cur.length && (cur.length >= 3 || len > 18 || gap > 0.6)) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.,?!]["”]?$/.test(w.w) || i === words.length - 1) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

const clean = (w: string) => w.replace(/["“”]/g, '').toUpperCase();

// Karaoke captions: white bold words with a thick dark outline, the spoken word turns yellow and grows a little
export const Captions: React.FC<{words: Word[]; y: number}> = ({words, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunks = React.useMemo(() => chunkWords(words), [words]);
  const idx = chunks.findIndex((c, i) => {
    const a = c[0].s - 0.05;
    const next = chunks[i + 1];
    const b = Math.min(next ? next[0].s - 0.05 : Infinity, c[c.length - 1].e + 0.7);
    return t >= a && t < b;
  });
  if (idx < 0) return null;
  const c = chunks[idx];
  const f0 = Math.round((c[0].s - 0.05) * fps);
  const pop = spring({frame: frame - f0, fps, config: {damping: 12, stiffness: 220}});
  return (
    <div
      style={{
        position: 'absolute',
        top: y - 70,
        width: 1080,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 46px',
        padding: '0 70px',
        boxSizing: 'border-box',
        transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])}) translateY(${(1 - pop) * 20}px)`,
        opacity: pop,
      }}
    >
      {c.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = t >= w.s - 0.03 && t < w.e + 0.05;
        const k = spring({frame: frame - Math.round(w.s * fps), fps, config: {damping: 14, stiffness: 260}});
        return (
          <span
            key={i}
            style={{
              fontFamily: 'Inter Display',
              fontWeight: 900,
              fontSize: 78,
              lineHeight: 1.15,
              color: on ? '#FFE21F' : 'white',
              WebkitTextStroke: '12px #111',
              paintOrder: 'stroke fill',
              textShadow: '0 6px 14px rgba(0,0,0,.55)',
              display: 'inline-block',
              transform: `scale(${now ? 1 + 0.08 * k : 1})`,
            }}
          >
            {clean(w.w)}
          </span>
        );
      })}
    </div>
  );
};
