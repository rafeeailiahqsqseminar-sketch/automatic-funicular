"""Bot Telegram Admin Komuniti.

Tugas:
  1. Mesej harian: setiap hari pada jam yang ditetapkan (asal 8:00 pagi), hantar satu
     mesej dari Bank Data ke group, kemudian lapor kepada Cikgu.
  2. Sambut ahli baru dalam group.
  3. Padam mesej berpautan daripada ahli yang bukan admin.
  4. Cikgu tambah mesej ke Bank Data dengan forward / hantar mesej kepada bot (chat peribadi).

Isi mesej Bank Data TIDAK disimpan dalam repo (repo ini public). Bot hanya simpan nombor
mesej dalam chat Cikgu, dan menyalin mesej asal ke group dengan copyMessage.
Jadi jangan padam mesej dalam chat bot selagi ia belum dihantar.

Arahan (chat peribadi, Cikgu sahaja):
  /bank            senarai mesej yang menunggu
  /lihat 3         tunjuk semula mesej #3
  /buang 3         buang mesej #3 (boleh beberapa: /buang 3 4 5)
  /hantar          hantar mesej seterusnya ke group sekarang
  /masa 08:00      tukar jam mesej harian
  /ucapan <teks>   tukar ucapan ahli baru ({nama} = nama ahli, {group} = nama group)
  /ucapan off      matikan ucapan,  /ucapan  -> lihat ucapan semasa
  /pautan on|off   hidup / matikan padam pautan
  /benar tiktok.com   benarkan domain ini dalam group,  /tolak tiktok.com  -> buang dari senarai
  /status          ringkasan tetapan

Dalam group (Cikgu sahaja): /sambung, /putus

Dijalankan oleh GitHub Actions (long polling ~5 jam 40 minit setiap larian). Pustaka standard sahaja.
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

MYT = timezone(timedelta(hours=8))
STATE_FILE = Path(os.environ.get("STATE_FILE", Path(__file__).parent / "data" / "komuniti.json"))

UCAPAN_ASAL = ("Selamat datang, {nama} 🌿\n\n"
               "Terima kasih kerana menyertai {group}. "
               "Semoga perjalanan ini membawa ketenangan dan kebaikan untuk diri.")

DEFAULT_STATE = {
    "owner_chat_id": None,
    "offset": 0,
    "group_id": None,
    "group_nama": None,
    "masa": "08:00",
    "terakhir_harian": None,     # tarikh (YYYY-MM-DD) mesej harian terakhir dihantar
    "next_id": 1,
    "bank": [],                  # {"id", "msg_ids": [...], "jenis", "dihantar": bool, "dihantar_pada"}
    "ucapan": UCAPAN_ASAL,       # None = ucapan dimatikan
    "pautan_padam": True,
    "domain_benar": [],
}
HAD_AMARAN = 60          # saat sebelum mesej amaran pautan dipadam
SIMPAN_REKOD_HARI = 30   # rekod mesej yang sudah dihantar disimpan selama ini


# ---------------------------------------------------------------- Telegram API
class TelegramRalat(Exception):
    def __init__(self, kod, keterangan):
        super().__init__(f"{kod}: {keterangan}")
        self.kod, self.keterangan = kod, keterangan


def api(method, **params):
    token = os.environ["TELEGRAM_TOKEN"]
    data = urllib.parse.urlencode(
        {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in params.items() if v is not None}
    ).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}", data=data)
    try:
        with urllib.request.urlopen(req, timeout=70) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            res = json.loads(e.read())
        except Exception:
            raise TelegramRalat(e.code, str(e))
    if not res.get("ok"):
        raise TelegramRalat(res.get("error_code"), res.get("description", ""))
    return res["result"]


def send(chat_id, text, **kw):
    hasil = None
    for i in range(0, max(len(text), 1), 4000):
        hasil = api("sendMessage", chat_id=chat_id, text=text[i:i + 4000], **kw)
    return hasil


def now():
    return datetime.now(MYT)


# ---------------------------------------------------------------- Bank Data
def jenis_mesej(msg):
    for k, nama in (("photo", "gambar"), ("video", "video"), ("animation", "GIF"), ("voice", "suara"),
                    ("audio", "audio"), ("document", "fail"), ("video_note", "video bulat"),
                    ("sticker", "sticker"), ("poll", "undian")):
        if k in msg:
            return nama
    return "teks"


def menunggu(state):
    return [m for m in state["bank"] if not m["dihantar"]]


def tambah_ke_bank(state, msg):
    """Forward / mesej biasa daripada Cikgu masuk ke Bank Data. Album digabung jadi satu item."""
    album = msg.get("media_group_id")
    if album:
        for m in reversed(state["bank"]):
            if m.get("album") == album and not m["dihantar"]:
                m["msg_ids"].append(msg["message_id"])
                return None  # sebahagian album yang sama: tiada balasan tambahan
    item = {"id": state["next_id"], "msg_ids": [msg["message_id"]], "jenis": jenis_mesej(msg),
            "album": album, "dihantar": False, "dihantar_pada": None}
    if album:
        item["jenis"] = "album"
    state["next_id"] += 1
    state["bank"].append(item)
    return item


def salin(state, item, ke_chat):
    ids = sorted(item["msg_ids"])
    if len(ids) == 1:
        api("copyMessage", chat_id=ke_chat, from_chat_id=state["owner_chat_id"], message_id=ids[0])
    else:
        api("copyMessages", chat_id=ke_chat, from_chat_id=state["owner_chat_id"], message_ids=ids)


def hantar_seterusnya(state, sebab="harian"):
    """Hantar satu mesej Bank Data ke group. Mesej yang sudah dipadam dari chat Cikgu dilangkau."""
    owner = state["owner_chat_id"]
    if not state["group_id"]:
        send(owner, "⚠️ Belum ada group disambung. Dalam group komuniti, taip /sambung.")
        return False
    for item in menunggu(state):
        try:
            salin(state, item, state["group_id"])
        except TelegramRalat as e:
            if e.kod == 400 and "message" in e.keterangan.lower() and "not found" in e.keterangan.lower():
                item["dihantar"], item["dihantar_pada"] = True, None  # mesej asal sudah dipadam
                send(owner, f"⚠️ Mesej #{item['id']} tidak dijumpai dalam chat ini (mungkin dipadam). "
                            f"Saya langkau dan cuba mesej seterusnya.")
                continue
            raise
        item["dihantar"], item["dihantar_pada"] = True, now().strftime("%Y-%m-%dT%H:%M")
        baki = len(menunggu(state))
        lapor = f"✅ Mesej #{item['id']} dihantar ke group {state['group_nama']}. Baki dalam Bank Data: {baki}."
        if baki == 0:
            lapor += "\n⚠️ Bank Data sudah kosong. Forward mesej baru kepada saya supaya esok ada mesej."
        elif baki <= 3:
            lapor += "\n💡 Bank Data hampir habis. Tambah mesej baru bila sempat."
        send(owner, lapor)
        return True
    send(owner, "⚠️ Bank Data kosong, tiada mesej dihantar ke group"
                + (" hari ini." if sebab == "harian" else ".")
                + "\nForward mesej kepada saya untuk tambah.")
    return False


def semak_harian(state):
    if state["owner_chat_id"] is None or not state["group_id"]:
        return
    t = now()
    hari_ini = t.strftime("%Y-%m-%d")
    if state["terakhir_harian"] == hari_ini or t.strftime("%H:%M") < state["masa"]:
        return
    state["terakhir_harian"] = hari_ini  # tanda dulu: jangan ulang hantar jika berlaku ralat
    try:
        hantar_seterusnya(state)
    except Exception as e:
        print(f"Gagal hantar mesej harian: {e}", file=sys.stderr, flush=True)
        send(state["owner_chat_id"], f"⚠️ Gagal hantar mesej harian ke group: {e}\nCuba /hantar.")
    had = (t - timedelta(days=SIMPAN_REKOD_HARI)).strftime("%Y-%m-%dT%H:%M")
    state["bank"] = [m for m in state["bank"] if not m["dihantar"] or (m["dihantar_pada"] or "") > had]


# ---------------------------------------------------------------- Chat peribadi (Cikgu)
def nombor(args):
    return [int(a.lstrip("#")) for a in args if a.lstrip("#").isdigit()]


def status(state):
    w = menunggu(state)
    return "\n".join([
        "📋 Status Admin Komuniti",
        f"Group: {state['group_nama'] or 'belum disambung (taip /sambung dalam group)'}",
        f"Mesej harian: setiap hari jam {state['masa']}",
        f"Bank Data: {len(w)} mesej menunggu",
        f"Ucapan ahli baru: {'hidup' if state['ucapan'] else 'mati'}",
        f"Padam pautan: {'hidup' if state['pautan_padam'] else 'mati'}"
        + (f" (dibenarkan: {', '.join(state['domain_benar'])})" if state["domain_benar"] else ""),
    ])


BANTUAN = """👋 Saya Admin Komuniti.

➕ Tambah mesej ke Bank Data: forward atau hantar mesej kepada saya. Teks, gambar, video dan album semua boleh. Boleh forward banyak mesej sekali gus.
⚠️ Jangan padam mesej dalam chat ini selagi belum dihantar, sebab saya salin mesej asal ke group.

/bank – senarai mesej menunggu
/lihat 3 – tunjuk mesej #3
/buang 3 – buang mesej #3
/hantar – hantar mesej seterusnya ke group sekarang
/masa 08:00 – tukar jam mesej harian
/ucapan <teks> – tukar ucapan ahli baru. Guna {nama} untuk nama ahli, {group} untuk nama group. /ucapan off untuk matikan.
/pautan on|off – padam pautan daripada ahli biasa
/benar tiktok.com – benarkan domain ini, /tolak tiktok.com – buang
/status – tetapan semasa

Dalam group: tambah saya sebagai admin (beri kuasa Delete messages), kemudian taip /sambung."""


def handle_peribadi(state, msg):
    chat_id = msg["chat"]["id"]
    if state["owner_chat_id"] is None:
        state["owner_chat_id"] = chat_id
    if chat_id != state["owner_chat_id"]:
        send(chat_id, "Maaf, bot ini peribadi.")
        return

    text = (msg.get("text") or "").strip()
    if not text.startswith("/"):
        item = tambah_ke_bank(state, msg)
        if item:
            send(chat_id, f"✅ Ditambah ke Bank Data sebagai #{item['id']} ({item['jenis']}). "
                          f"Menunggu: {len(menunggu(state))}.", disable_notification=True)
        return

    cmd, *args = text.split()
    cmd = cmd.split("@")[0].lower()

    if cmd in ("/start", "/help", "/bantuan"):
        send(chat_id, BANTUAN)
    elif cmd == "/status":
        send(chat_id, status(state))
    elif cmd == "/bank":
        w = menunggu(state)
        if not w:
            send(chat_id, "Bank Data kosong. Forward mesej kepada saya untuk tambah.")
            return
        hari = now().date()
        if now().strftime("%H:%M") >= state["masa"] or state["terakhir_harian"] == hari.isoformat():
            hari += timedelta(days=1)
        baris = [f"📚 Bank Data: {len(w)} mesej menunggu (jam {state['masa']})"]
        for i, m in enumerate(w[:50]):
            baris.append(f"#{m['id']} {m['jenis']} → {(hari + timedelta(days=i)).strftime('%d/%m')}")
        if len(w) > 50:
            baris.append(f"… dan {len(w) - 50} lagi")
        baris.append("\n/lihat <nombor> untuk tunjuk mesej, /buang <nombor> untuk buang.")
        send(chat_id, "\n".join(baris))
    elif cmd == "/lihat":
        ids = nombor(args)
        item = next((m for m in state["bank"] if ids and m["id"] == ids[0]), None)
        if not item:
            send(chat_id, "Contoh: /lihat 3 (nombor dari /bank)")
            return
        try:
            salin(state, item, chat_id)
        except TelegramRalat as e:
            send(chat_id, f"⚠️ Mesej #{item['id']} tidak dapat dipaparkan: {e.keterangan}")
    elif cmd == "/buang":
        ids = set(nombor(args))
        dibuang = [m["id"] for m in state["bank"] if m["id"] in ids and not m["dihantar"]]
        state["bank"] = [m for m in state["bank"] if m["id"] not in dibuang]
        send(chat_id, f"🗑 Dibuang: {', '.join('#' + str(i) for i in dibuang)}" if dibuang
             else "Contoh: /buang 3 (nombor dari /bank)")
    elif cmd == "/hantar":
        hantar_seterusnya(state, sebab="manual")
    elif cmd == "/masa":
        m = re.fullmatch(r"(\d{1,2})[:.](\d{2})", args[0]) if args else None
        if not m or int(m[1]) > 23 or int(m[2]) > 59:
            send(chat_id, f"Jam sekarang: {state['masa']}. Contoh: /masa 08:00")
            return
        state["masa"] = f"{int(m[1]):02d}:{m[2]}"
        send(chat_id, f"⏰ Mesej harian kini dihantar setiap hari jam {state['masa']}.")
    elif cmd == "/ucapan":
        teks = text.split(None, 1)[1].strip() if len(text.split(None, 1)) > 1 else ""
        if not teks:
            send(chat_id, f"Ucapan semasa:\n\n{state['ucapan']}" if state["ucapan"]
                 else "Ucapan ahli baru sedang mati. Taip /ucapan <teks> untuk hidupkan.")
        elif teks.lower() == "off":
            state["ucapan"] = None
            send(chat_id, "Ucapan ahli baru dimatikan.")
        elif teks.lower() in ("on", "asal"):
            state["ucapan"] = UCAPAN_ASAL
            send(chat_id, f"Ucapan ahli baru dihidupkan:\n\n{UCAPAN_ASAL}")
        else:
            state["ucapan"] = teks
            send(chat_id, "✅ Ucapan baru disimpan. Contoh:\n\n" + isi_ucapan(teks, "Aminah", state["group_nama"]))
    elif cmd == "/pautan":
        if args and args[0].lower() in ("on", "off"):
            state["pautan_padam"] = args[0].lower() == "on"
        send(chat_id, f"Padam pautan: {'hidup' if state['pautan_padam'] else 'mati'}. (/pautan on atau /pautan off)")
    elif cmd in ("/benar", "/tolak"):
        d = args[0].lower().removeprefix("https://").removeprefix("http://").removeprefix("www.").strip("/") \
            if args else ""
        if not d:
            send(chat_id, f"Contoh: {cmd} tiktok.com\nDibenarkan sekarang: {', '.join(state['domain_benar']) or 'tiada'}")
            return
        if cmd == "/benar" and d not in state["domain_benar"]:
            state["domain_benar"].append(d)
        elif cmd == "/tolak" and d in state["domain_benar"]:
            state["domain_benar"].remove(d)
        send(chat_id, f"Domain dibenarkan: {', '.join(state['domain_benar']) or 'tiada'}")
    else:
        send(chat_id, "Arahan tidak dikenali. Taip /help untuk senarai arahan.")


# ---------------------------------------------------------------- Group
_admin_cache = {}       # chat_id -> (masa_tamat, set(user_id))
_amaran_dipadam = []    # (masa_padam, chat_id, message_id) — tidak disimpan ke repo


def admin_group(chat_id):
    tamat, ids = _admin_cache.get(chat_id, (0, set()))
    if time.time() < tamat:
        return ids
    try:
        ids = {a["user"]["id"] for a in api("getChatAdministrators", chat_id=chat_id)}
    except Exception as e:
        print(f"Gagal dapatkan admin group: {e}", file=sys.stderr, flush=True)
    _admin_cache[chat_id] = (time.time() + 600, ids)
    return ids


def nama_orang(u):
    return " ".join(x for x in (u.get("first_name"), u.get("last_name")) if x) or u.get("username") or "kawan"


def isi_ucapan(teks, nama, group):
    return teks.replace("{nama}", nama).replace("{group}", group or "komuniti ini")


URL_TANPA_ENTITI = re.compile(r"(?:https?://|www\.|t\.me/|telegram\.me/)\S+", re.I)


def pautan_dalam(msg):
    """Senarai pautan dalam teks / caption mesej."""
    hasil = []
    for teks_k, ent_k in (("text", "entities"), ("caption", "caption_entities")):
        teks = msg.get(teks_k) or ""
        # offset entiti Telegram dikira dalam unit UTF-16
        u16 = teks.encode("utf-16-le")
        for e in msg.get(ent_k) or []:
            if e["type"] == "text_link":
                hasil.append(e["url"])
            elif e["type"] == "url":
                hasil.append(u16[e["offset"] * 2:(e["offset"] + e["length"]) * 2].decode("utf-16-le"))
        hasil += URL_TANPA_ENTITI.findall(teks)
    return hasil


def domain(url):
    u = url if "://" in url else "http://" + url
    return (urllib.parse.urlparse(u).hostname or "").lower().removeprefix("www.")


def dibenarkan(state, url):
    d = domain(url)
    return any(d == b or d.endswith("." + b) for b in state["domain_benar"])


def handle_group(state, msg):
    chat_id = msg["chat"]["id"]
    dari = msg.get("from", {})
    text = (msg.get("text") or "").strip()
    cmd = text.split()[0].split("@")[0].lower() if text.startswith("/") else ""
    dari_cikgu = state["owner_chat_id"] is not None and dari.get("id") == state["owner_chat_id"]

    if cmd in ("/sambung", "/putus") and dari_cikgu:
        if cmd == "/sambung":
            state["group_id"] = chat_id
            state["group_nama"] = msg["chat"].get("title") or "group"
            send(state["owner_chat_id"], f"📢 Group '{state['group_nama']}' disambung. "
                                         f"Mesej harian akan dihantar setiap hari jam {state['masa']}.")
            try:
                api("deleteMessage", chat_id=chat_id, message_id=msg["message_id"])
            except Exception:
                pass
        elif state["group_id"] == chat_id:
            send(state["owner_chat_id"], f"Group '{state['group_nama']}' diputuskan.")
            state["group_id"] = state["group_nama"] = None
        return

    if chat_id != state["group_id"]:
        return

    # 2. Sambut ahli baru
    baru = [u for u in msg.get("new_chat_members") or [] if not u.get("is_bot")]
    if baru and state["ucapan"]:
        nama = ", ".join(nama_orang(u) for u in baru)
        send(chat_id, isi_ucapan(state["ucapan"], nama, state["group_nama"]))
        return

    # 3. Padam pautan daripada ahli biasa
    if not state["pautan_padam"] or msg.get("is_automatic_forward"):
        return
    if msg.get("sender_chat", {}).get("id") == chat_id:   # admin tanpa nama
        return
    if dari.get("is_bot") or dari.get("id") in admin_group(chat_id) or dari_cikgu:
        return
    pautan = [p for p in pautan_dalam(msg) if not dibenarkan(state, p)]
    if not pautan:
        return
    try:
        api("deleteMessage", chat_id=chat_id, message_id=msg["message_id"])
    except TelegramRalat as e:
        print(f"Gagal padam pautan: {e}", file=sys.stderr, flush=True)
        send(state["owner_chat_id"], "⚠️ Saya jumpa pautan dalam group tetapi tidak dapat padam. "
                                     "Pastikan saya admin dengan kuasa 'Delete messages'.")
        return
    amaran = send(chat_id, f"⚠️ {nama_orang(dari)}, pautan tidak dibenarkan dalam group ini. Mesej telah dipadam.",
                  disable_notification=True)
    if amaran:
        _amaran_dipadam.append((time.time() + HAD_AMARAN, chat_id, amaran["message_id"]))


def padam_amaran_lama():
    t = time.time()
    for item in [a for a in _amaran_dipadam if a[0] <= t]:
        _amaran_dipadam.remove(item)
        try:
            api("deleteMessage", chat_id=item[1], message_id=item[2])
        except Exception:
            pass


def handle(state, msg, diedit=False):
    jenis = msg["chat"].get("type")
    if jenis == "private":
        if diedit:
            return  # mesej yang diedit sudah ada dalam Bank Data; copyMessage akan guna versi terkini
        handle_peribadi(state, msg)
    elif jenis in ("group", "supergroup"):
        handle_group(state, msg)


# ---------------------------------------------------------------- Main
def simpan(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
    print("Data komuniti dikemaskini.", flush=True)
    if os.environ.get("BOT_GIT_PUSH"):
        cmds = [["git", "add", str(STATE_FILE)], ["git", "commit", "-qm", "Kemaskini bot komuniti [skip ci]"],
                ["git", "pull", "-q", "--rebase"], ["git", "push", "-q"]]
        for c in cmds:
            r = subprocess.run(c, capture_output=True, text=True)
            if r.returncode:
                print(f"Gagal simpan ({' '.join(c)}): {r.stderr.strip()}", file=sys.stderr, flush=True)
                return


def main():
    token = os.environ.get("TELEGRAM_TOKEN", "").strip()
    if not token:
        print("Secret KOMUNITI_TOKEN belum ditambah. Bot tidak dijalankan.", flush=True)
        return  # bukan ralat: elak emel "workflow gagal" setiap 15 minit sebelum Cikgu pasang
    os.environ["TELEGRAM_TOKEN"] = token
    try:
        me = api("getMe")
    except TelegramRalat as e:
        if e.kod in (401, 404):
            sys.exit("RALAT: Telegram tolak KOMUNITI_TOKEN (salah token). Salin semula token dari @BotFather.")
        raise
    print(f"Bot: @{me.get('username')}", flush=True)

    hook = api("getWebhookInfo").get("url")
    if hook:
        sys.exit("RALAT: bot ini masih disambung ke webhook lain (contohnya n8n). "
                 "Matikan workflow n8n untuk bot ini dahulu, kemudian jalankan semula.")

    state = {**DEFAULT_STATE, **json.loads(STATE_FILE.read_text())} if STATE_FILE.exists() else dict(DEFAULT_STATE)

    lama = float(os.environ.get("BOT_LAMA_MINIT", "0"))
    tamat = time.time() + lama * 60
    while True:
        asal = json.dumps(state, sort_keys=True)
        try:
            updates = api("getUpdates", offset=state["offset"], timeout=20 if lama else 0,
                          allowed_updates=["message", "edited_message"])
            for u in updates:
                state["offset"] = u["update_id"] + 1
                msg = u.get("message") or u.get("edited_message")
                if msg:
                    try:
                        handle(state, msg, diedit="edited_message" in u)
                    except Exception as e:
                        print(f"Ralat mesej {u['update_id']}: {e}", file=sys.stderr, flush=True)
            semak_harian(state)
            padam_amaran_lama()
        except Exception as e:
            if not lama:
                raise
            print(f"Ralat sementara: {e}", file=sys.stderr, flush=True)
            time.sleep(5)
        if json.dumps(state, sort_keys=True) != asal:
            simpan(state)
        if time.time() >= tamat:
            break


if __name__ == "__main__":
    main()
