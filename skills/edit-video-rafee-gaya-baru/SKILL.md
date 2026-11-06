---
name: edit-video-rafee-gaya-baru
description: Edit Rafee Ailiah's TikTok talking-head videos in the "gaya baru" style. Gold pop words, gold key-point cards with a turning DNA helix, and a gold end card, all placed on the empty wall above his head. The video's own burned-in captions stay untouched, and only soft quiet wooshes are added. The skill carries its own HTML animation code, rendered frame by frame with Playwright, so it does not need the Project folder kod/edit-video/. Use it whenever Cikgu Rafee uploads a .MOV/.MP4 that already has captions, says "gaya baru", "kod baru", "macam Ilmu Leluhur", or asks for HyperFrames on his own footage. Also use it when the edit-video-tiktok-rafee skill cannot reach kod/edit-video/.
---

# Edit Video Rafee — Gaya Baru (biru-emas DNA)

First approved on "Ilmu Leluhur" (3 Nov 2026). Animated intro added and approved on "Kaya Sekejap" (5 Nov 2026). Cover photo, chest-placed intro and background music approved on "3 Tanda Kau Memaafkan" (6 Nov 2026). Reply to Cikgu in short, simple Bahasa Melayu with numbered steps. Show results, not long explanations.

## Why this layout
His videos often arrive already cut, with a cover image and burned-in yellow-white captions (lower third, about y≈1500 in 1080×1920). His face sits in the "chest zone" (about y 700–1200). So all text and animation go on the **empty wall above his head (centre y≈400, `head_y`)**. That way nothing covers his face or his captions. Check this on a test frame for every video. If he sits higher, lower `head_y`, or shrink it.

## HyperFrames?
The HyperFrames MCP `compose` cannot trim or cut his footage. It mutes his video, makes its own voice, and stops at 90 s. It is also disabled from Claude Code. So when he says "guna hyper frames", explain this in one line and use this skill instead. It is the same idea: HTML/JS animation rendered frame by frame.

## Bundled code (in `scripts/`; copy the folder to a work dir first)
- `overlay.html`: the animation engine, a deterministic `render(t)` function (no GSAP; the CDN is blocked). It has gold gradient text (Inter Display Black), a soft navy backdrop glow so gold reads on a bright wall, sparkles, a light sweep, a DNA double helix (gold + accent), a glass navy end-card panel and a golden opening shimmer.
- `render_overlay.js timeline.json OUT full|test t1 t2…`: renders transparent PNGs, only for frames where graphics are active.
- `build_seq.py timeline.json OUT SEQ`: fills the remaining frames with a blank symlink.
- `make_sfx.py timeline.json sfx.wav`: soft wooshes only (peak ≈ -16 dBFS). He asked for "woosh yang lembut, tak terlalu kuat", so no pops and no loud hits.
- `caption_strips.sh SRC OUT [y] [h]`: tiles the burned-in caption band at 2 fps with timestamps. Read the images to get the transcript and its timing (there is no whisper here).
- `final_render.sh SRC SEQ voice.wav sfx.wav DUR OUTBASE`: scale/crop to 1080×1920, overlay, mix, crf 20, plus a `_tg.mp4` under 9 MB (720p, bitrate set from the duration).
- `assets/timeline_example.json`: the real Ilmu Leluhur timeline. Copy it and edit it for each video.
- `assets/timeline_kaya_sekejap.json`: a real timeline WITH the animated intro (`intro` + first card at ~2.45 s).
- `assets/timeline_orang_baik.json`: intro scene `orang_baik` + compact end card ("KOMUNITI KAMI").
- `assets/timeline_memaafkan.json`: intro + title on the CHEST, no box, no pops, no end card (the latest approved look).
- `assets/timeline_cover_memaafkan.json`: timeline for the cover photo (one frame).
- `mix_music.sh SRC MUSIC DUR OUT.wav [dB]`: cleaned voice + background music at -22 dB (fade in 1 s, out 3 s). Use its output as voice.wav.

## Mukadimah (animated intro), when he asks for "frame mukadimah" / "foto animasi"
- Order: an illustration in a glass navy panel (y 90–560, `intro:{t0:0.15,t1:2.55,scene}`), then a title card at about 2.45 s for 2.9 s (`top` hook question, a 2-line `title`, white `sub`). It all stays in the first ~5.3 s, before the first pop, and overlays the footage, so the duration and caption sync do not change.
- Built-in scene `kaya_sekejap`: gold car, flying RM notes and a gold chart rising, then a red crash and shake, then the car becomes a smoky kapcai. For another topic, write a new scene function in `overlay.html` in the same style (vector canvas drawing; no stock photos) and tie it to his story.
- ALWAYS show a mockup first: a 5-frame hstack PNG plus a 5.5 s preview mp4 (a timeline copy with `duration:5.6`, no pops, end moved to 99). Suggest the title text and wait for "ok". The text is new, so it needs his approval.
- Fast re-render once approved: render only the intro window (the preview frames), copy them over the full overlay dir, rerun make_sfx with the new timeline, build_seq, then final_render. No full re-render is needed.

## Latest preference (Memaafkan, 6 Nov 2026) — use this by default for "cover + mukadimah"
- **Placement:** he wants the intro animation AND the title **in the middle of the chest** (`intro.y≈1060, h≈340, box:false`; card `y≈1270`). No black box: `box:false` draws only a small soft navy glow (`backdrop(Y+H*.62,H*.75,.7)`) so it reads on his white shirt without darkening his face. Keep everything above his burned-in captions (top ≈1450).
- **Title size:** smaller than before, `fs:100` (cover 110). He said "kecilkan".
- **Timing:** intro 0.15–2.6 s, then title card at 2.45 s for 2.9 s, at the same chest spot.
- **Illustration:** simple story figures tied to the topic. Built-in scenes: `kaya_sekejap`, `orang_baik` (4 gold pillars hold a roof; the glowing "orang baik" pillar cracks red and vanishes, the roof tilts and cracks), `memaafkan` (gold heart cracks, fog, kintsugi seal), `minta_maaf` (gold man walks in, bows with hands together, "Maaf..." bubble; woman in pink tudung crosses arms, turns her face away, grey cloud). Pass extra config with `intro.y`, `intro.h`, `intro.box`.
- Card config now takes `y` (centre y) and `fs` (max title font size).
- If he asks for only "cover + mukadimah", do NOT add pops/cards/end card unless he asks (`pops:[]`, `end.t:999`).

## Foto Cover (when he asks for "foto cover")
1. Pick a calm frame with no burned caption, eyes open (often ~0.5 s): `ffmpeg -ss T -i SRC -vf "scale=1080:H2:flags=lanczos,crop=1080:1920:0:CY" -frames:v 1 base.png` (H2/CY as in final_render.sh; 352×640 → 1964 / 15).
2. Copy `assets/timeline_cover_memaafkan.json`, change the text. On the cover there are no captions, so the illustration sits on the chest (`y≈990`) and the title goes below it (`card y≈1520, fs 110`).
3. `node render_overlay.js tl_cover.json cov test 1.6`, then `ffmpeg -i base.png -i cov/t1.6.png -filter_complex "overlay,unsharp=5:5:0.6" Cover_<Tajuk>.png`.
4. Send the cover FIRST, together with the mukadimah preview. He asks "foto cover mana?" if it is late.

## Muzik latar (when he uploads a backsound or says "masuk muzik latar")
- He wants it "paling ringkas dan cepat": the music runs the whole video at -22 dB under the voice. No ducking or editing. Use `mix_music.sh`, then `final_render.sh` with the result as voice.wav. Overlay renders only the intro window, so a full 2-minute render takes about 2 minutes. Run it as one chained job.
- Expect about -14 LUFS. Offer "kuatkan / perlahankan" (change the dB).

## Steps
1. **Inspect:** run ffprobe and make a contact sheet (`fps=1/15,scale=270:-1,tile=4x3`). Note the resolution (low-res sources such as 352×640 will look soft; say so), any cover image, transitions (e.g. colour-bar glitch) and the caption position.
2. **Pauses:** RMS in 100 ms bins. If the video is already cut tight (pauses about 1 s or less), **do not cut**, because cutting would desync the burned captions. Say this in one line. If it has long pauses, follow the LONGGAR rule from edit-video-tiktok-rafee.
3. **Transcript:** run `caption_strips.sh`, then Read each capN.png. Choose:
   - **Pop words** (8–12): words he stresses, highlighted words that matter, numbered points. Keep about 4–5 s or more between them.
   - **Cards** (3–5): key sentences as `top` (small gold) + `title` (1–2 big gold lines) + `sub` (white). Use `dna:true` for heritage, memory or generation ideas.
   - **End card (since 5 Nov 2026):** NO class promo. He said "KELAS ONLINE PERCUMA" looks cheap ("nampak murahan"). Use the compact card: `label:"BERGABUNG BERSAMA"`, `big:"KOMUNITI KAMI"`, `platform:""`, `question:""`, `cta_text:"KLIK LINK BIO"` (empty platform and question switch to the shorter 380 px panel). Start it just before "Saya Rafee Ailiah", or before the CTA he actually says. See `assets/timeline_orang_baik.json`.
   - Skip pops over an inserted image or cover that already has its own title.
4. **Refine times** at 10 fps (16×1 strips around each target). A pop starts when the yellow highlight lands on the word, or about 0.1 s before.
5. **Timeline JSON:** set duration, pops, cards, end, `accent` (rgb; change the palette per video so it differs from the last one: cyan `110,215,255`, violet `180,140,255`, red `255,110,90`…), and `head_y`.
6. **Test frames:** run `render_overlay.js … test` at a pop, a card and the end card. Composite them on real frames (`scale=1080:H,crop=1080:1920:0:35%`) with hstack, then Read the result. Check that nothing covers his hair, face or captions. Fix it before the full render.
7. **Full render** (run_in_background): render_overlay full, then build_seq. Note the argument order `render_overlay.js TIMELINE OUTDIR MODE …`; swapping OUTDIR and MODE starts a full render by mistake.
   He prefers **"gabung terus"**: chain render → build_seq → audio → final_render as ONE background job, not step by step.
8. **Audio:** `highpass=f=80,afftdn=nf=-28:nt=w,lowpass=f=12000`, then `loudnorm=I=-14:TP=-1.5:LRA=9`, stereo 48 k, then make_sfx.
9. **final_render.sh** (run_in_background). Aim for about -14 LUFS; -13 is acceptable.
10. **Verify:** take an 8-frame hstack (opening, pops, cards, end) and Read it. Then SendUserFile both files (render).
11. **Report** in about 8 short Malay bullets: what was done, the pop and card list, the CTA, the woosh level, and the LUFS. Offer fixes by timestamp. Remind him to send it himself to Bank Data with a caption and #komuniti.

## Rules carried over
- Commit and push deliverables (mp4, _tg.mp4, mockups, cover png) to the session branch only after the render has finished. Never commit a file that is still being written.
- render_overlay.js argument order is `TIMELINE OUTDIR MODE`. `node render_overlay.js tl.json test t 1.2` renders FULL into a dir named `test` (a common slip).
- No health claims and no promised results in on-screen text.
- No background music unless asked (an uploaded backsound file counts as asking). Wooshes stay soft.
- Fonts available: Inter / Inter Display (Black, ExtraBold, Bold…). Poppins is NOT installed.
- If he says "stop" or "stop dulu": stop the running job (TaskStop) and confirm in one line.

## Remotion (gaya pro, 6 Nov 2026), saved and liked, not yet used on a real video
- Code: repo folder `remotion-rafee/` (Remotion 4.0.538). `npm install`, then `npx remotion render src/index.ts Cinta|Kewangan out.mp4`. The browser path is set in `remotion.config.ts` (Playwright headless shell).
- Look: slow camera push-in plus a punch on the title, word-by-word blur-in title, one key word on a coloured box (pink for love, red for money), typewriter sub, gold flash between the illustration and the title, and a vignette.
- Scenes: `cinta` (man and woman joined by a light thread, beating heart) and `kewangan` (RM counter up to 10,000, then red crash, falling coins, flying RM note). Both sit on the chest (`sceneY`, `cardY`).
- `CintaOverlay` / `KewanganOverlay` render without footage (transparent, for overlaying in ffmpeg). Put the source clip in `public/` and set `bg`.
- The title texts are suggestions he has not approved yet. Confirm them before a full render.
