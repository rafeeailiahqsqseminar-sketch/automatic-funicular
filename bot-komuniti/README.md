# Bot Admin Komuniti (Telegram)

Bot ini menggantikan bot Admin Komuniti dalam n8n dan berjalan percuma di GitHub Actions.

**Tugas bot**

1. Setiap hari jam 8:00 pagi, bot hantar satu mesej dari Bank Data ke group komuniti, kemudian lapor kepada Cikgu: "✅ Mesej #12 dihantar… Baki: 40".
2. Bot sambut ahli baru dalam group.
3. Bot padam mesej berpautan daripada ahli biasa. Pautan daripada admin tidak disentuh.
4. Cikgu tambah mesej ke Bank Data dengan forward mesej kepada bot.

Isi mesej Bank Data tidak disimpan dalam GitHub, kerana repo ini public. Bot hanya ingat nombor mesej, dan bila tiba masa ia salin mesej asal dari chat Cikgu ke group. **Jangan padam mesej dalam chat bot selagi belum dihantar.**

## Pasang (sekali sahaja)

**A. Pilih bot**

Pilih salah satu.

*Pilihan 1: bot baru (paling selamat, bot n8n terus berjalan sehingga bot baru siap diuji)*

1. Buka **@BotFather** di Telegram.
2. Taip `/newbot` dan hantar.
3. Taip nama, contohnya `Admin Komuniti Rafee`.
4. Taip username yang berakhir dengan `bot`.
5. Salin token yang diberi.

*Pilihan 2: guna bot Admin Komuniti yang sedia ada*

1. Buka n8n dan **matikan (Inactive)** workflow bot Admin Komuniti. Kalau tidak dimatikan, bot baru tidak dapat berjalan.
2. Buka **@BotFather** dan taip `/mybots`.
3. Pilih bot Admin Komuniti, kemudian tekan **API Token** dan salin token.

**B. Masukkan token dalam GitHub**

1. Buka repo `automatic-funicular` di GitHub.
2. Klik **Settings**.
3. Klik **Secrets and variables**, kemudian **Actions**.
4. Klik **New repository secret**.
5. Pada **Name**, taip `KOMUNITI_TOKEN`.
6. Pada **Secret**, tampal token (Cmd + V).
7. Klik **Add secret**.

**C. Hidupkan bot**

1. Merge kod bot ini ke branch utama repo (sekarang `claude/new-session-c5roqr`).
2. Di GitHub, klik **Actions**, kemudian **Bot Admin Komuniti**, kemudian **Run workflow**.
3. Buka bot di Telegram dan tekan **Start**. Orang pertama yang tekan Start menjadi pemilik bot.

**D. Sambung ke group komuniti**

1. Buka group **Bebas Dari Masa Lalu – Komuniti**.
2. Tekan nama group, kemudian **Administrators**, kemudian **Add Admin**.
3. Cari bot dan tambah. Pastikan **Delete messages** dihidupkan.
4. Dalam group, taip `/sambung` dan hantar. Bot akan padam arahan itu dan beritahu Cikgu dalam chat peribadi.

**E. Pindahkan Bank Data lama**

1. Buka chat **Bank Data Bebas dari Masa Lalu**.
2. Tekan lama pada mesej pertama yang **belum** dihantar, kemudian tekan **Select**.
3. Pilih semua mesej yang belum dihantar, ikut susunan.
4. Tekan **Forward**, kemudian pilih bot Admin Komuniti.
5. Taip `/bank` kepada bot untuk semak senarai.

## Cara guna

| Buat apa | Caranya |
|---|---|
| Tambah mesej | Forward atau hantar mesej kepada bot (teks, gambar, video, album) |
| Lihat Bank Data | `/bank` |
| Lihat satu mesej | `/lihat 3` |
| Buang mesej | `/buang 3` |
| Hantar mesej seterusnya sekarang | `/hantar` |
| Tukar jam mesej harian | `/masa 08:00` |
| Tukar ucapan ahli baru | `/ucapan Selamat datang {nama} ke {group}!` |
| Matikan ucapan | `/ucapan off` |
| Hidup atau matikan padam pautan | `/pautan on` atau `/pautan off` |
| Benarkan satu laman | `/benar tiktok.com` (buang dengan `/tolak tiktok.com`) |
| Lihat tetapan | `/status` |

## Ujian

1. Forward satu mesej kepada bot. Bot balas: "✅ Ditambah ke Bank Data sebagai #1".
2. Taip `/hantar`. Mesej itu muncul dalam group, dan bot lapor kepada Cikgu.

Kalau bot tak balas: di GitHub, klik **Actions**, kemudian **Bot Admin Komuniti**, kemudian buka larian terakhir dan baca mesej ralat.
