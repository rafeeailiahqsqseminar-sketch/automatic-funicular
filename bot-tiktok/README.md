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

Jam asal ialah 8:30 malam setiap hari (waktu Malaysia). Bot semak setiap 10 minit, jadi balasan dan peringatan boleh lewat sehingga kira-kira 10 hingga 15 minit.

## Ujian

Forward satu video kepada bot dan tunggu 10 minit. Bot akan balas "✅ #1 ... 📅 tarikh dan jam".
Kalau tak mahu tunggu: di GitHub, klik **Actions**, kemudian **Bot Jadual TikTok**, kemudian **Run workflow**.
