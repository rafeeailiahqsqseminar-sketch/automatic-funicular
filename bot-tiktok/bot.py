"""Bot Telegram untuk susun jadual posting TikTok.

Cara guna (dalam Telegram):
  - Forward / hantar video kepada bot  -> bot letak dalam slot kosong seterusnya
  - Caption video Telegram = caption TikTok (boleh tukar: reply video itu dengan teks baru)
  - /jadual            -> senarai video yang menunggu
  - /buang 3           -> buang video nombor 3 dari jadual
  - /masa 12:30 20:30  -> tukar jam posting harian
  - /susun             -> susun semula semua video ikut slot terdekat
  - /pautan            -> pautan daftar untuk peserta kursus
  - /peserta           -> bilangan peserta

Peserta kursus daftar melalui pautan /pautan (tekan Start). Bila tiba masa posting,
setiap peserta terima video itu secara peribadi. Peserta boleh taip /berhenti.

Skrip ini dijalankan oleh GitHub Actions setiap 10 minit. Setiap kali jalan,
ia baca mesej baru, kemaskini jadual dan hantar peringatan yang sudah tiba masanya.
Hanya pustaka standard Python digunakan.
"""

import json
import os
import hashlib
import hmac
import time
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

MYT = timezone(timedelta(hours=8))  # Malaysia tiada waktu musim panas
STATE_FILE = Path(os.environ.get("STATE_FILE", Path(__file__).parent / "data" / "jadual.json"))
HARI = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"]
BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"]

DEFAULT_STATE = {
    "owner_chat_id": None,
    "offset": 0,
    "masa": ["20:30"],
    "next_id": 1,
    "senarai": [],
    "peserta": [],
}


def kod_daftar():
    # Dijana daripada token rahsia supaya kod tidak tersimpan dalam repo awam
    return hmac.new(os.environ["TELEGRAM_TOKEN"].encode(), b"peserta", hashlib.sha256).hexdigest()[:12]


# ---------------------------------------------------------------- Telegram API
def api(method, **params):
    token = os.environ["TELEGRAM_TOKEN"]
    data = urllib.parse.urlencode(
        {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in params.items() if v is not None}
    ).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}", data=data)
    with urllib.request.urlopen(req, timeout=30) as r:
        res = json.loads(r.read())
    if not res.get("ok"):
        raise RuntimeError(f"{method}: {res}")
    return res["result"]


def send(chat_id, text, **kw):
    # Telegram hadkan 4096 aksara setiap mesej
    for i in range(0, max(len(text), 1), 4000):
        api("sendMessage", chat_id=chat_id, text=text[i:i + 4000], **kw)


# ---------------------------------------------------------------- Masa & slot
def now():
    override = os.environ.get("BOT_NOW")  # untuk ujian sahaja
    return datetime.fromisoformat(override).replace(tzinfo=MYT) if override else datetime.now(MYT)


def fmt(slot_iso):
    d = datetime.fromisoformat(slot_iso)
    jam = d.strftime("%I:%M").lstrip("0")
    waktu = "pagi" if d.hour < 12 else "tengah hari" if d.hour < 14 else "petang" if d.hour < 19 else "malam"
    return f"{HARI[d.weekday()]} {d.day} {BULAN[d.month - 1]}, {jam} {waktu}"


def next_free_slot(state, after, taken):
    masa = sorted(state["masa"])
    day = after.date()
    while True:
        for m in masa:
            h, mi = map(int, m.split(":"))
            slot = datetime(day.year, day.month, day.day, h, mi, tzinfo=MYT)
            iso = slot.strftime("%Y-%m-%dT%H:%M")
            if slot > after and iso not in taken:
                return iso
        day += timedelta(days=1)


def pending(state):
    return sorted((v for v in state["senarai"] if not v["dihantar"]), key=lambda v: v["slot"])


def susun_semula(state):
    taken = set()
    t = now()
    for v in pending(state):
        v["slot"] = next_free_slot(state, t, taken)
        taken.add(v["slot"])


# ---------------------------------------------------------------- Mesej masuk
def tajuk_dari(msg):
    media = msg.get("video") or msg.get("document") or {}
    nama = media.get("file_name")
    if nama:
        return Path(nama).stem.replace("_", " ")
    cap = (msg.get("caption") or "").strip()
    if cap:
        return cap.splitlines()[0][:60]
    return None


def is_video(msg):
    if msg.get("video"):
        return True
    doc = msg.get("document")
    return bool(doc and (doc.get("mime_type") or "").startswith("video/"))


def handle(state, msg):
    chat_id = msg["chat"]["id"]
    if state["owner_chat_id"] is None:
        state["owner_chat_id"] = chat_id
    if chat_id != state["owner_chat_id"]:
        handle_peserta(state, msg)
        return

    text = (msg.get("text") or "").strip()

    if is_video(msg):
        taken = {v["slot"] for v in pending(state)}
        item = {
            "id": state["next_id"],
            "chat_id": chat_id,
            "message_id": msg["message_id"],
            "tajuk": tajuk_dari(msg) or f"Video #{state['next_id']}",
            "caption": msg.get("caption") or "",
            "slot": next_free_slot(state, now(), taken),
            "dihantar": False,
        }
        state["next_id"] += 1
        state["senarai"].append(item)
        nota = "" if item["caption"] else "\n(Tiada caption. Reply video ini dengan caption TikTok.)"
        send(chat_id, f"✅ Video ke-{item['id']} dicatat: {item['tajuk']}\n📅 {fmt(item['slot'])}\n"
                      f"🎬 Menunggu: {len(pending(state))} video | 👥 Peserta: {len(state['peserta'])}{nota}",
             reply_to_message_id=msg["message_id"])
        return

    reply = msg.get("reply_to_message")
    if reply and text and not text.startswith("/"):
        for v in pending(state):
            if v["message_id"] == reply["message_id"]:
                v["caption"] = text
                send(chat_id, f"✏️ Caption #{v['id']} {v['tajuk']} dikemaskini.")
                return

    cmd, *args = text.split() if text else [""]
    cmd = cmd.split("@")[0].lower()

    if cmd in ("/start", "/help", "/bantuan"):
        send(chat_id,
             "Assalamualaikum Cikgu! 👋\n\n"
             "1. Forward video kepada saya, saya letak dalam jadual.\n"
             "2. Caption video = caption TikTok. Nak tukar? Reply video itu dengan caption baru.\n"
             "3. Bila tiba masa, saya hantar balik video + caption untuk Cikgu post.\n\n"
             f"Jam posting sekarang: {', '.join(sorted(state['masa']))}\n\n"
             "/jadual - lihat jadual\n/buang 3 - buang video #3\n"
             "/masa 12:30 20:30 - tukar jam posting\n/susun - rapatkan semula jadual\n"
             "/pautan - pautan daftar peserta kursus\n/peserta - bilangan peserta")
    elif cmd == "/jadual":
        p = pending(state)
        if not p:
            send(chat_id, "Jadual kosong. Forward video untuk mula.")
        else:
            baris = [f"#{v['id']} {fmt(v['slot'])}\n    {v['tajuk']}{'' if v['caption'] else ' ⚠️ tiada caption'}" for v in p]
            send(chat_id, f"📅 Jadual posting ({len(p)} video menunggu, {state['next_id'] - 1} dicatat, "
                          f"{len(state['peserta'])} peserta):\n\n" + "\n".join(baris))
    elif cmd == "/buang":
        ids = {int(a.lstrip("#")) for a in args if a.lstrip("#").isdigit()}
        before = len(state["senarai"])
        state["senarai"] = [v for v in state["senarai"] if v["dihantar"] or v["id"] not in ids]
        send(chat_id, "🗑️ Dibuang." if len(state["senarai"]) < before else "Nombor tak jumpa. Guna /jadual untuk lihat nombor.")
    elif cmd == "/masa":
        ok = []
        for a in args:
            try:
                h, m = map(int, a.replace(".", ":").split(":"))
                assert 0 <= h < 24 and 0 <= m < 60
                ok.append(f"{h:02d}:{m:02d}")
            except (ValueError, AssertionError):
                pass
        if not ok:
            send(chat_id, "Contoh: /masa 20:30  atau  /masa 12:30 20:30")
        else:
            state["masa"] = sorted(set(ok))
            susun_semula(state)
            send(chat_id, f"⏰ Jam posting: {', '.join(state['masa'])}. Jadual disusun semula, taip /jadual.")
    elif cmd == "/pautan":
        bot_user = api("getMe")["username"]
        send(chat_id, "Kongsi pautan ini dengan peserta kursus. Mereka tekan Start untuk daftar:\n\n"
                      f"https://t.me/{bot_user}?start={kod_daftar()}")
    elif cmd == "/peserta":
        send(chat_id, f"👥 {len(state['peserta'])} peserta berdaftar.")
    elif cmd == "/susun":
        susun_semula(state)
        send(chat_id, "🔄 Jadual disusun semula. Taip /jadual.")
    elif text:
        send(chat_id, "Forward video kepada saya, atau taip /bantuan.")


def handle_peserta(state, msg):
    chat_id = msg["chat"]["id"]
    text = (msg.get("text") or "").strip()
    cmd, *args = text.split() if text else [""]
    berdaftar = chat_id in state["peserta"]

    if cmd == "/start" and args and hmac.compare_digest(args[0], kod_daftar()):
        if not berdaftar:
            state["peserta"].append(chat_id)
            nama = msg.get("from", {}).get("first_name", "Peserta")
            send(state["owner_chat_id"], f"👤 Peserta baru: {nama} (jumlah {len(state['peserta'])})")
        send(chat_id, "Assalamualaikum! ✅ Anda sudah berdaftar.\n"
                      "Video kursus akan dihantar kepada anda di sini ikut jadual.\nTaip /berhenti untuk berhenti.")
    elif cmd == "/berhenti" and berdaftar:
        state["peserta"].remove(chat_id)
        send(chat_id, "Anda tidak akan menerima video lagi. Tekan /start dengan pautan daftar untuk sertai semula.")
    elif berdaftar:
        send(chat_id, "Anda sudah berdaftar. Video akan dihantar ikut jadual. Taip /berhenti untuk berhenti.")
    else:
        send(chat_id, "Bot ini untuk peserta kursus. Minta pautan daftar daripada penganjur.")


# ---------------------------------------------------------------- Hantar peringatan
def hantar_yang_tiba(state):
    t = now().strftime("%Y-%m-%dT%H:%M")
    for v in pending(state):
        if v["slot"] > t:
            break
        api("copyMessage", chat_id=v["chat_id"], from_chat_id=v["chat_id"], message_id=v["message_id"],
            caption=f"🔔 Masa posting TikTok!\n#{v['id']} {v['tajuk']}")
        send(v["chat_id"], v["caption"] or "(Tiada caption)")
        dapat = 0
        for p in list(state["peserta"]):
            try:
                api("copyMessage", chat_id=p, from_chat_id=v["chat_id"], message_id=v["message_id"],
                    caption=v["caption"][:1024] if v["caption"] else None)
                dapat += 1
            except urllib.error.HTTPError as e:
                if e.code in (400, 403):  # peserta sekat bot / akaun dipadam
                    state["peserta"].remove(p)
            time.sleep(0.05)  # had Telegram ~30 mesej sesaat
        if state["peserta"] or dapat:
            send(v["chat_id"], f"📤 Video #{v['id']} dihantar kepada {dapat} peserta.")
        v["dihantar"] = True
        v["dihantar_pada"] = t
    # buang rekod yang sudah dihantar lebih 14 hari
    had = (now() - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M")
    state["senarai"] = [v for v in state["senarai"] if not v["dihantar"] or v.get("dihantar_pada", t) > had]


# ---------------------------------------------------------------- Main
def main():
    token = os.environ.get("TELEGRAM_TOKEN", "").strip()
    if not token:
        sys.exit("RALAT: secret TELEGRAM_TOKEN kosong. Tambah di Settings > Secrets and variables > Actions.")
    os.environ["TELEGRAM_TOKEN"] = token
    try:
        api("getMe")
    except urllib.error.HTTPError as e:
        if e.code in (401, 404):
            sys.exit("RALAT: Telegram tolak TELEGRAM_TOKEN (salah token). Salin semula token dari @BotFather.")
        raise

    state = {**DEFAULT_STATE, **json.loads(STATE_FILE.read_text())} if STATE_FILE.exists() else dict(DEFAULT_STATE)
    asal = json.dumps(state, sort_keys=True)

    while True:
        updates = api("getUpdates", offset=state["offset"], timeout=0, allowed_updates=["message"])
        if not updates:
            break
        for u in updates:
            state["offset"] = u["update_id"] + 1
            if "message" in u:
                try:
                    handle(state, u["message"])
                except Exception as e:  # satu mesej rosak jangan hentikan bot
                    print(f"Ralat mesej {u['update_id']}: {e}", file=sys.stderr)

    hantar_yang_tiba(state)

    if json.dumps(state, sort_keys=True) != asal:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
        print("Jadual dikemaskini.")


if __name__ == "__main__":
    main()
