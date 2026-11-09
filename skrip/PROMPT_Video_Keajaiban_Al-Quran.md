Tolong buat video TikTok siri "Keajaiban Al-Quran" untuk konten di bawah, guna kod yang sudah ada dalam repo ini.

## Konten
<!-- Tampal di sini: tajuk, rujukan surah & ayat, terjemahan ringkas, keterangan mendalam -->
[TAMPAL KONTEN DI SINI]

## Peraturan
- Teks terjemahan dan keterangan ikut nota saya. Jangan ubah isi tanpa izin.
- Ayat Arab mesti tepat dan berbaris, dengan nombor ayat ﴿١٥﴾ (bukan ۝).
- Jawab dalam Bahasa Melayu, ringkas dan terus.
- Commit dan push ke branch yang ditetapkan sesi ini.

## Kod yang sudah ada (remotion-rafee/)
- `src/Ayat.tsx`: komponen video menegak 1080×1920, 30 fps. Susunannya: hook → kad ayat (Arab + terjemahan ditaip) → ilustrasi SVG + 4 kad isi → end card "سُبْحَانَ اللّٰه" + "BERGABUNG BERSAMA KOMUNITI KAMI · KLIK LINK BIO". Latar zamrud-biru gelap dengan corak bintang 8 dan tema emas.
- `src/data/ayat.ts`: data setiap video (`ubun`, `dengar`, `sulbi`) dan versi suara (`ubunVO`, `dengarVO`, `sulbiVO`). Tambah video baru di sini, kemudian daftarkan di `src/Root.tsx`.
- Ilustrasi sedia ada: `anim: 'otak' | 'janin' | 'sulbi'`. Untuk topik baru, tambah komponen SVG baru dalam `Ayat.tsx` dengan pola yang sama (prop `f, fps, st, sf`; `st` = indeks kad semasa).
- Fon Arab Amiri dimuat dari `public/fonts/` kerana browser render tidak dapat capai Google Fonts.
- `tools/ayat_sfx.py OUT.wav ["ayat,p1,p2,p3,p4,end,total"]`: woosh lembut pada setiap pertukaran babak.
- `tools/prep_srt.py SRT OUT.json DURASI "" "salah=>betul" audio.f32`: masa setiap perkataan dari SRT ElevenLabs, untuk karaoke caption.
- `tools/tambah_muzik.sh VIDEO MUZIK OUT [dB]`: masukkan muzik latar ke video tanpa suara.

## Langkah
1. `cd remotion-rafee && npm ci`.
2. Tambah data video baru dalam `src/data/ayat.ts`. Isinya: part, hookTop, hook, hl, hookSub, arab, surah, surah2 (jika ada), terjemahan, anim, 4 points dan endLine. Daftarkan dalam `Root.tsx` dengan `durationInFrames={Math.round(ayatDuration(4) * 30)}`.
3. Semak dulu: `npx remotion bundle src/index.ts --out-dir <scratchpad>/bundle`, kemudian render beberapa still dengan `npx remotion still <bundle> <Id> x.png --frame=N --scale=0.4` dan gabungkan dengan `hstack`. Lihat imej itu sebelum render penuh.
4. Render penuh dari bundle, gabungkan dengan woosh (`ayat_sfx.py`), dan simpan ke `output/Keajaiban_<n>_<Nama>.mp4` berserta `Cover_...png` (frame 100).
5. Buat caption TikTok dalam `skrip/Caption_Keajaiban_<n>_<Nama>.txt`, ikut format caption sedia ada (hook, ayat, ✅ 3 isi, Subhanallah, CTA komen, "Bergabung bersama komuniti kami, klik link bio", "— Rafee Ailiah, sahabat hati dan fikiran anda", hashtag).
6. Buat skrip ElevenLabs dalam `skrip/ElevenLabs_Keajaiban_<n>_<Nama>.txt`, ikut format `<break time="0.3s" />` sedia ada. Satu perenggan untuk setiap babak. Jangan masukkan teks Arab. Tutup dengan "Saya Rafee Ailiah... sahabat hati, dan fikiran anda. Bergabung bersama komuniti kami. Klik link bio."

## Versi suara (bila saya hantar MP3 + SRT dari ElevenLabs)
1. Semak dulu MP3 itu betul: durasinya mesti hampir sama dengan hujung SRT.
2. `ffmpeg -i VO.mp3 -ac 1 -ar 16000 -f f32le vo.f32`, kemudian `prep_srt.py` dengan pembetulan nama `"Rafi ...=>Rafee Ailiah"` dan ejaan lain.
3. Baca masa perkataan, kemudian isi `timing: {ayat, tr0, tr1, points: [4 masa], end, total}`. `ayat` = sebelum "Allah berfirman"; `tr0`/`tr1` = mula/habis bacaan terjemahan; `points` = perkataan pertama setiap kad isi; `end` = ayat penutup; `total` = durasi MP3.
4. Tambah `words`, kemudian daftarkan komposisi `<Id>VO` dalam Root.tsx.
5. Gabungkan bunyi:
   `[VO]highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=9` + `[muzik]volume=-3dB, fade in 1 s / out 3 s` + `sfx`, guna `amix=normalize=0`, dan simpan ke `output/..._VO.mp4`.

## Perhatian
- Jangan namakan prop `ref` (React akan error #290).
- Muzik latar saya: muat naik semula `muzik_latar.mp3` dalam chat baru (fail lama tidak ikut). Untuk video tanpa suara, guna `tambah_muzik.sh ... 5`.
- Kalau fail muat naik 0 bait, minta saya muat naik semula.
