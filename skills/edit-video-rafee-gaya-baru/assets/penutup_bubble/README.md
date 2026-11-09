# Penutup Bubble (Menerima Kemiskinan, 9 Nov 2026)

Penutup: video Cikgu (baju oren) dalam bulatan emas, gelembung terapung,
teks "TERIMA KASIH / SILA FOLLOW & KLIK LINK BIO".

- `overlay_bubble.html`: overlay.html + kapsyen kata-demi-kata (`caps`, `cap_y`) + penutup (`outro`).
- `render_overlay.js`: tunggu gambar bubble dimuat setiap frame.
- `final_render.sh`: guna `v:0` sahaja dan tpad (bekukan frame akhir untuk penutup).
- `bubble_clip.mp4`: klip 4.2 s (480x480) dari Drive `copy_EF0E144F-...mov` (mula 3 s, crop 720x720 x=180).
- `timeline_menerima_kemiskinan.json`: contoh timeline (`outro: {t, top, l1, l2}`, end.t=999).

Guna semula:
1. Salin fail ini ke folder `scripts/` (overlay_bubble.html -> overlay.html).
2. `mkdir scripts/bf && ffmpeg -i bubble_clip.mp4 -q:v 3 -start_number 0 scripts/bf/%04d.jpg`
3. Tambah `outro` dalam timeline, dan pad suara (`apad=whole_dur=DUR`).
