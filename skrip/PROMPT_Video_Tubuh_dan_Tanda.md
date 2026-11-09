Tolong buat video TikTok format "Tubuh & Tanda" (gaya Keajaiban + face bubble) untuk konten di bawah, guna kod yang sudah ada dalam repo ini.

## Konten
<!-- Tampal di sini: tajuk siri, bahagian (cth 1/3), skrip VO, 4 isi (bahagian badan + emosi), ayat penutup -->
[TAMPAL KONTEN DI SINI]

## Fail yang saya beri
- MP3 + SRT dari ElevenLabs (muat naik dalam chat, atau ada di Google Drive).
- Video muka saya (dummy, sesolah-olah baca skrip) di Google Drive. Kalau tiada yang baru, guna `copy_EF0E144F-F799-4778-9988-AFCE2969150E.mov`.
- Muzik latar: `muzik latar.mp3` di Google Drive.
- Foto kad: `remotion-rafee/public/peta_emosi.jpg` (atau foto baru yang saya muat naik).
Fail Drive boleh dimuat turun terus: `curl -sSL -o FAIL "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"` (cari ID dengan alat Google Drive).

## Peraturan
- Teks ikut skrip saya. Jangan ubah isi tanpa izin.
- Jawab dalam Bahasa Melayu, ringkas dan terus.
- Commit dan push ke branch yang ditetapkan sesi ini.

## Kod yang sudah ada (remotion-rafee/)
- `src/Ayat.tsx`: hook → kad (foto + ayat ditaip) → ilustrasi + 4 kad isi → end card. Prop tambahan: `badge`, `kadLabel`, `image`, `endBig`.
- Ilustrasi badan: `anim: 'tubuh'` (kepala, leher, bahu, belakang atas), `'tubuh2'` (pinggang, pinggul, siku, tangan), `'tubuh3'` (lutut, paha & betis, buku lali, tapak kaki). Untuk bahagian badan lain, tambah set baru dengan `TubuhBase` dan senarai titik `TPt`.
- Contoh data: `tubuh1VO`, `tubuh2VO`, `tubuh3VO` dalam `src/data/ayat.ts`.
- `tools/prep_srt.py`: masa setiap perkataan dari SRT.
- `tools/ayat_sfx.py`: woosh setiap pertukaran babak.
- `tools/face_bubble.py`: muka dalam bulatan emas + "RAFEE AILIAH" + "Sahabat Hati & Fikiran Anda".

## Langkah
1. `git fetch origin claude/epic-gates-yqpg1g` dan gabungkan ke branch sesi ini. Kemudian `cd remotion-rafee && npm ci`.
2. Semak MP3: durasi mesti hampir sama dengan hujung SRT.
3. `ffmpeg -i VO.mp3 -ac 1 -ar 16000 -f f32le vo.f32`, kemudian `python3 -I tools/prep_srt.py SRT src/data/<nama>_vo.json DURASI "" "" vo.f32`.
4. Tambah data dalam `src/data/ayat.ts` (ikut `tubuh1VO`): `timing: {ayat, tr0, tr1, points: [4 masa], end, total}`.
   `ayat` = sebelum ayat kad; `tr0`/`tr1` = mula/habis ayat kad; `points` = perkataan pertama setiap isi; `end` = ayat penutup; `total` = durasi MP3.
   Daftarkan `<Id>VO` dalam `Root.tsx` dengan `durationInFrames={Math.round(total * 30)}`.
5. Bundle, render beberapa still (`--scale=0.4`), gabung dengan `hstack` dan lihat dahulu.
6. Render penuh, kemudian gabung bunyi:
   `[VO]highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=9` + `[muzik]volume=-3dB, fade in 1 s / out 3 s` + woosh (`ayat_sfx.py OUT.wav "ayat,p1,p2,p3,p4,end,total"`), `amix=normalize=0` → `output/<Nama>_VO.mp4`.
7. Face bubble: `python3 -I tools/face_bubble.py output/<Nama>_VO.mp4 muka.mov output/<Nama>_FaceBubble.mp4 "ayat,p1,end" --pos X,Y`.
   Pilih `--pos` di ruang kosong sebelah ilustrasi (tubuh: -32,770; tubuh2: 0,260; tubuh3: 0,380). Semak still dahulu.
8. Cover dari frame kad isi pertama → `output/Cover_<Nama>_FaceBubble.png`.
9. Caption TikTok dalam `skrip/Caption_<Nama>.txt` (ikut `Caption_Tubuh_dan_Tanda_1.txt`; hashtag mesti ada `#komuniti`).

## Perhatian
- Render dengan `--concurrency=2` dan `-threads 2` (memori terhad).
- Jangan namakan prop `ref` (React error #290).
- Kalau fail muat naik 0 bait, minta saya muat naik semula.
