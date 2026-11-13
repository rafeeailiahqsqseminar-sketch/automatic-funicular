---
name: edit-video-doodle-motivasi
description: Edit Cikgu Rafee Ailiah's TikTok videos in the "doodle motivasi" style (first approved on "Berhenti", 13 Nov 2026). Hand-drawn stick-figure doodles sit in a white box with a yellow border at the top. Big Luckiest Guy captions show 1–2 words at a time, with the spoken word in yellow and the rest in white. The video uses his ElevenLabs voice-over, his own background song, soft "wow" SFX (woosh, riser, boom, shimmer), and ALWAYS ends with his end.mov follow/link-bio clip. Use when he uploads footage plus a script, ElevenLabs mp3 or SRT, or a reference video with doodle animations, or says "gaya Berhenti", "gaya doodle", "animasi orang lidi", "guna animasi dari video contoh", or "tema motivasi".
---

# Edit Video — Doodle Motivasi (gaya "Berhenti")

Reply to Cikgu in **short, simple Bahasa Melayu**, with numbered points. He wants it **"cepat dan pantas"**: run things in parallel and in the background, and do not ask unnecessary questions.

## What he approved (do not change without asking)
1. **Doodles inside a box:** a white rounded box with a 9 px yellow border `#FFD600` and a soft shadow, at the top of the frame (`box_y` 50, `doodle_scale` 1.25). It pops in each time the doodle changes. Black line art only.
2. **Captions:** Luckiest Guy, about 128 px, 12 px black stroke, 1–2 words per chunk, centred at y=1400 (bottom, so faces stay clear). **The word being spoken is yellow and the rest are white.**
3. **Audio:** his ElevenLabs voice, plus his background song (ducked under the voice, volume 0.30, sidechain), plus soft SFX. Delete the footage's original sound. Final level is -14 LUFS.
4. **End clip:** `assets/end.mov` is appended to the end of **EVERY video** (6.8 s, keeping its own audio). He said: "masukan ini dalam setiap video saya".
5. Output is 1080×1920 at 30 fps, crf 19.

## Files
- `scripts/transcribe.py VOICE OUT.json [ms] [prompt]` gives word timestamps. It needs `pip install faster-whisper`. Whisper sometimes drops the first sentence; put it in `lead_words` in the config.
- `scripts/build_overlay.py CONFIG test OUTDIR t…` makes test PNGs. `… full OUT.mov 4` renders the full overlay in 4 parallel processes (about 3–4 min for 50 s).
- `scripts/make_sfx.py CONFIG sfx.wav` adds a woosh at every doodle change, a riser + boom at `impacts`, and a shimmer at `shimmers`.
- `scripts/final.sh BASE OVERLAY VOICE SONG SONG_START SFX DUR OUT [END]` mixes, overlays, and appends end.mov.
- `assets/doodles/*.png` holds 12 doodles (stop, kaunseling, penyelamat, balang_kaca, meletup, patah_hati, ditiup_marah, bangku_hati, berdua, kusut, pasangan_bahagia, sibuk_multitasking). Reuse them when they fit the theme.
- `assets/contoh_berhenti.json` is the real config. Copy it and edit it.
- `assets/LuckiestGuy.ttf` and `assets/end.mov`.

## Steps
1. **Inspect:** run ffprobe, and make a 1 s contact sheet (`fps=1,scale=120:-1,tile=12x7`) of the footage. Note the resolution. A low-res 352×640 source looks soft, so say so in one line.
2. **Script (if he asks):** rewrite it in **"bahasa Melayu orang sekarang"** (casual: kau, tak payah, settle, toxic, relationship, past/future) in ElevenLabs v3 format, with `[serious] [calm] [pause] [sad] [warm] [confident]` tags and `...` for pauses. Keep the meaning the same. Then ask for the ElevenLabs mp3 so the captions can be synced.
3. **Transcribe** the mp3 (`transcribe.py`). Use his SRT for the correct spelling (`word_fix`, and merge "lama -lama" automatically).
4. **Doodles:** split the script into 8–12 sentences, with one doodle per sentence. Pick a PNG from `assets/doodles`. If he gives a **reference video with doodles over a sky background**, use the animated mode `{"ref":…, "r0","r1","crop_bottom", "t0","t1"}`: map each doodle with a 2 fps top-half tile of the reference video (`crop=576:540:0:0`). Avoid the fade-in/out frames, and set `crop_bottom` above the reference's captions or any head.
5. **Base cut:** choose the best footage segments so the total length equals the voice duration. Skip blurry or empty shots and put the meaningful shots (such as hugging) on the last line. Use `trim…,scale=1080:1920,fps=30` → concat → `eq=contrast=1.04:saturation=1.08,unsharp=5:5:0.6`, with `-an`.
6. **Test frames** (`build_overlay.py … test`): composite 4 of them on base frames with hstack, then Read the result. Check that the box does not cover faces too much and that the captions do not go off the edge.
7. **Song:** find where the music starts (1 s RMS bins); that is SONG_START. Check with whisper (`vad_filter=True`) that it has no vocals.
8. **Chain everything in one background job:** `build_overlay full` → `make_sfx` → `final.sh`.
9. **Verify:** take a 7-frame hstack of the output and Read it, then SendUserFile (render). Commit and push the mp4 to the session branch after the render has finished.
10. **Report** in 5–8 short Malay points, then offer fixes by timestamp ("lagu kuat sikit", "kapsyen lebih besar"…).

## Rules
- No health claims and no promised results in the on-screen text.
- Use a lagu latar only if he provides one. Do not make up music unless asked.
- If he says "stop", stop the job and confirm in one line.
