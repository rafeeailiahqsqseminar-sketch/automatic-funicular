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

## Post terus ke TikTok (auto-post)

Bila auto-post ON, bila tiba masa bot muat naik video terus ke TikTok dengan caption, tanpa Cikgu sentuh. Kalau gagal, bot hantar peringatan biasa supaya Cikgu post sendiri.

**Perkara penting**

- Video mesti **20MB ke bawah**. Itu had Telegram untuk bot muat turun video. Video lebih besar akan dihantar sebagai peringatan biasa.
- Sebelum app TikTok Cikgu **lulus audit TikTok**, semua video hanya boleh dipost sebagai **Private** (hanya Cikgu nampak). Lepas lulus audit, video dipost sebagai Public.
- TikTok mungkin tolak audit untuk bot peribadi. Kalau ditolak, auto-post kekal Private sahaja.

**A. Buat app di TikTok for Developers**

1. Buka https://developers.tiktok.com dan log masuk dengan akaun TikTok Cikgu.
2. Klik **Manage apps**, kemudian **Connect an app**.
3. Isi nama app, ikon, kategori dan penerangan.
4. Isi **Terms of Service URL** dan **Privacy Policy URL**. TikTok wajibkan dua pautan ini.
5. Pada **Platforms**, pilih **Web** dan isi alamat laman web Cikgu.
6. Klik **Add products**, kemudian tambah **Login Kit** dan **Content Posting API**.
7. Dalam **Content Posting API**, hidupkan **Direct Post**.
8. Dalam **Login Kit**, pada **Redirect URI**, tampal:
   `https://github.com/rafeeailiahqsqseminar-sketch/automatic-funicular`
9. Pada **Scopes**, pastikan `user.info.basic` dan `video.publish` ditanda.
10. Klik **Submit for review**. Semasa menunggu, Cikgu boleh guna **Sandbox** (langkah B).

**B. Guna Sandbox sementara menunggu (pilihan)**

1. Dalam app, tukar suis di atas dari **Production** ke **Sandbox**, kemudian klik **Create Sandbox**.
2. Ulang langkah A6 hingga A9 dalam Sandbox.
3. Klik **Target Users**, kemudian tambah akaun TikTok Cikgu.
4. Guna **Client key** dan **Client secret** Sandbox dalam langkah C. Bila app lulus, tukar kepada kunci Production.

**C. Masukkan kunci dalam GitHub**

1. Dalam app TikTok, salin **Client key** dan **Client secret**.
2. Buka repo `automatic-funicular` di GitHub, klik **Settings**, kemudian **Secrets and variables**, kemudian **Actions**.
3. Klik **New repository secret**. Name: `TIKTOK_CLIENT_KEY`, Secret: tampal Client key. Klik **Add secret**.
4. Klik **New repository secret** sekali lagi. Name: `TIKTOK_CLIENT_SECRET`, Secret: tampal Client secret. Klik **Add secret**.

**D. Sambung dalam bot**

1. Dalam chat bot, taip `/sambungtiktok` dan hantar.
2. Tekan pautan yang bot beri, log masuk TikTok dan tekan **Authorize**.
3. Satu halaman GitHub akan terbuka. Salin alamat penuh di bar alamat.
4. Tampal alamat itu dalam chat bot dan hantar.
5. Bot balas "✅ Disambung". Auto-post kini ON.

| Buat apa | Caranya |
|---|---|
| Hidup / matikan auto-post | `/autotiktok on` atau `/autotiktok off` |
| Tukar privasi post | `/privasitiktok awam`, `/privasitiktok kawan` atau `/privasitiktok sendiri` |
| Semak sambungan | `/statustiktok` |
| Putuskan TikTok | `/putustiktok` |

Sambungan kekal selama setahun. Selepas itu, taip `/sambungtiktok` semula.
