# Bot Jadual TikTok (Telegram)

Forward video kepada bot. Bot susun jadual, dan bila tiba masa posting bot hantar balik video itu bersama caption. Cikgu cuma perlu simpan video dan post ke TikTok.

## Pasang (sekali sahaja)

**A. Buat bot Telegram**

1. Buka Telegram dan cari **@BotFather**.
2. Tekan **Start**.
3. Taip `/newbot` dan hantar.
4. Taip nama bot, contohnya `Jadual TikTok Rafee`.
5. Taip username bot yang berakhir dengan `bot`, contohnya `jadual_tiktok_rafee_bot`.
6. Salin token yang BotFather beri (bentuknya `123456:ABC...`).

**B. Masukkan token dalam GitHub**

1. Buka repo `automatic-funicular` di GitHub.
2. Klik **Settings**.
3. Klik **Secrets and variables**, kemudian **Actions**.
4. Klik **New repository secret**.
5. Pada **Name**, taip `TELEGRAM_TOKEN`.
6. Pada **Secret**, tampal token dari BotFather (Cmd + V).
7. Klik **Add secret**.

**C. Hidupkan bot**

1. Merge pull request bot ini ke branch utama repo (sekarang `claude/new-session-c5roqr`). GitHub hanya jalankan jadual dari branch utama.
2. Buka bot Cikgu di Telegram dan tekan **Start**. Orang pertama yang tekan Start menjadi pemilik bot, dan orang lain akan ditolak.

## Cara guna

| Buat apa | Caranya |
|---|---|
| Masukkan video | Forward video kepada bot. Caption video itu akan jadi caption TikTok. |
| Tukar caption | Reply video itu dalam chat bot dengan caption baru. |
| Lihat jadual | `/jadual` |
| Buang video | `/buang 3` (nombor dari `/jadual`) |
| Tukar jam posting | `/masa 20:30` atau `/masa 12:30 20:30` (dua kali sehari) |
| Rapatkan jadual | `/susun` |

## Kongsi video ke group kursus

1. Buka group Telegram kursus.
2. Tekan nama group di atas, kemudian **Add Members** (Tambah Ahli).
3. Cari username bot Cikgu dan tambah ke group.
4. Dalam group itu, taip `/sambung` dan hantar. Hanya Cikgu boleh sambung group.
5. Dalam chat peribadi dengan bot, taip `/tiktok https://www.tiktok.com/@namaCikgu` supaya pautan TikTok disertakan dalam mesej group.

Lepas itu, setiap kali bot hantar peringatan posting, video yang sama akan dikongsi ke group **30 minit kemudian** dengan mesej "🎬 Video baru dah keluar!". Masa 30 minit itu memberi peluang Cikgu post ke TikTok dulu.

| Buat apa | Caranya |
|---|---|
| Kongsi ke group sekarang | `/kongsi 3` |
| Lihat group yang disambung | `/group` |
| Berhenti kongsi ke group | `/putus` |

Bot tidak membalas mesej lain dalam group.

Jam asal ialah 8:30 malam setiap hari (waktu Malaysia). Bot sentiasa berjaga dan balas dalam beberapa saat. Setiap larian GitHub berjaga kira-kira 5 jam 40 minit, kemudian larian seterusnya terus mengambil alih.

## Ujian

Forward satu video kepada bot. Bot akan balas dalam beberapa saat: "✅ #1 ... 📅 tarikh dan jam".
Kalau bot tak balas: di GitHub, klik **Actions**, kemudian **Bot Jadual TikTok**, kemudian **Run workflow**.
