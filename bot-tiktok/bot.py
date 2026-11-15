"""Bot Telegram untuk susun jadual posting TikTok.

Cara guna (dalam Telegram):
  - Forward / hantar video kepada bot  -> bot letak dalam slot kosong seterusnya
  - Caption video Telegram = caption TikTok (boleh tukar: reply video itu dengan teks baru)
  - /jadual            -> senarai video yang menunggu
  - /buang 3           -> buang video nombor 3 dari jadual
  - /masa 12:30 20:30  -> tukar jam posting harian
  - /susun             -> susun semula semua video ikut slot terdekat

Kongsi ke group kursus:
  - Tambah bot ke group, kemudian taip /sambung dalam group itu
  - 30 minit selepas peringatan posting, bot kongsi video itu ke group
  - /tiktok <pautan>    -> pautan profil TikTok yang disertakan dalam mesej group
  - /kongsi 3           -> kongsi video #3 ke group sekarang
  - /group              -> lihat group yang disambung,  /putus -> putuskan group

Skrip ini dijalankan oleh GitHub Actions setiap 10 minit. Setiap kali jalan,
ia baca mesej baru, kemaskini jadual dan hantar peringatan yang sudah tiba masanya.
Hanya pustaka standard Python digunakan.
"""

import json
import os
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
    "group_id": None,
    "group_nama": None,
    "tiktok": None,
}
LEWAT_GROUP = timedelta(minutes=30)  # beri masa Cikgu post ke TikTok dulu


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
    if msg["chat"].get("type") in ("group", "supergroup"):
        handle_group(state, msg)
        return
    if state["owner_chat_id"] is None:
        state["owner_chat_id"] = chat_id
    if chat_id != state["owner_chat_id"]:
        send(chat_id, "Maaf, bot ini peribadi.")
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
        send(chat_id, f"✅ #{item['id']} {item['tajuk']}\n📅 {fmt(item['slot'])}{nota}",
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
             "/masa 12:30 20:30 - tukar jam posting\n/susun - rapatkan semula jadual\n\n"
             "Group kursus: tambah saya ke group, kemudian taip /sambung dalam group itu.\n"
             "/tiktok <pautan> - pautan TikTok untuk mesej group\n/kongsi 3 - kongsi video #3 ke group sekarang\n"
             "/group - lihat group\n/putus - putuskan group")
    elif cmd == "/jadual":
        p = pending(state)
        if not p:
            send(chat_id, "Jadual kosong. Forward video untuk mula.")
        else:
            baris = [f"#{v['id']} {fmt(v['slot'])}\n    {v['tajuk']}{'' if v['caption'] else ' ⚠️ tiada caption'}" for v in p]
            send(chat_id, "📅 Jadual posting:\n\n" + "\n".join(baris))
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
    elif cmd == "/group":
        if state["group_id"]:
            send(chat_id, f"📢 Group: {state['group_nama']}\nVideo dikongsi ke group 30 minit selepas peringatan posting.\n"
                          f"Pautan TikTok: {state['tiktok'] or 'belum ditetapkan (/tiktok <pautan>)'}")
        else:
            send(chat_id, "Belum ada group. Tambah saya ke group kursus, kemudian taip /sambung dalam group itu.")
    elif cmd == "/putus":
        state["group_id"] = state["group_nama"] = None
        send(chat_id, "Group diputuskan. Video tidak akan dikongsi ke group lagi.")
    elif cmd == "/tiktok":
        state["tiktok"] = args[0] if args else None
        send(chat_id, f"🔗 Pautan TikTok: {state['tiktok']}" if state["tiktok"] else "Contoh: /tiktok https://www.tiktok.com/@namaanda")
    elif cmd == "/kongsi":
        ids = {int(a.lstrip("#")) for a in args if a.lstrip("#").isdigit()}
        v = next((v for v in state["senarai"] if v["id"] in ids), None)
        if not state["group_id"]:
            send(chat_id, "Belum ada group. Taip /sambung dalam group kursus dulu.")
        elif not v:
            send(chat_id, "Contoh: /kongsi 3 (nombor dari /jadual)")
        else:
            kongsi_ke_group(state, v)
    elif cmd == "/susun":
        susun_semula(state)
        send(chat_id, "🔄 Jadual disusun semula. Taip /jadual.")
    elif text:
        send(chat_id, "Forward video kepada saya, atau taip /bantuan.")


def handle_group(state, msg):
    """Dalam group, bot hanya dengar /sambung dan /putus daripada Cikgu. Mesej lain diabaikan."""
    text = (msg.get("text") or "").strip()
    cmd = text.split()[0].split("@")[0].lower() if text else ""
    dari_cikgu = state["owner_chat_id"] is not None and msg.get("from", {}).get("id") == state["owner_chat_id"]
    if cmd not in ("/sambung", "/putus") or not dari_cikgu:
        return
    if cmd == "/sambung":
        state["group_id"] = msg["chat"]["id"]
        state["group_nama"] = msg["chat"].get("title") or "group"
        send(state["group_id"], "✅ Group ini disambung. Video baru akan dikongsi di sini ikut jadual.")
        send(state["owner_chat_id"], f"📢 Group '{state['group_nama']}' disambung.")
    elif state["group_id"] == msg["chat"]["id"]:
        state["group_id"] = state["group_nama"] = None
        send(msg["chat"]["id"], "Group ini diputuskan.")


def kongsi_ke_group(state, v):
    teks = f"🎬 Video baru dah keluar!\n{v['tajuk']}"
    if state["tiktok"]:
        teks += f"\n\nTonton & komen di TikTok 👇\n{state['tiktok']}"
    try:
        api("copyMessage", chat_id=state["group_id"], from_chat_id=v["chat_id"], message_id=v["message_id"],
            caption=teks)
        v["group_dikongsi"] = True
        send(state["owner_chat_id"], f"📢 Video #{v['id']} {v['tajuk']} dikongsi ke group {state['group_nama']}.")
    except urllib.error.HTTPError as e:
        v["group_dikongsi"] = True  # jangan cuba berulang kali
        send(state["owner_chat_id"], f"⚠️ Gagal kongsi video #{v['id']} ke group (ralat {e.code}). "
                                     "Pastikan saya masih ahli group, kemudian taip /sambung semula dalam group.")


# ---------------------------------------------------------------- Hantar peringatan
def hantar_yang_tiba(state):
    t = now().strftime("%Y-%m-%dT%H:%M")
    for v in pending(state):
        if v["slot"] > t:
            break
        api("copyMessage", chat_id=v["chat_id"], from_chat_id=v["chat_id"], message_id=v["message_id"],
            caption=f"🔔 Masa posting TikTok!\n#{v['id']} {v['tajuk']}")
        send(v["chat_id"], v["caption"] or "(Tiada caption)")
        v["dihantar"] = True
        v["dihantar_pada"] = t
        if state["group_id"]:
            v["group_pada"] = (now() + LEWAT_GROUP).strftime("%Y-%m-%dT%H:%M")
            send(v["chat_id"], f"📢 Video ini akan dikongsi ke group {state['group_nama']} pada "
                               f"{fmt(v['group_pada'])}. Nak kongsi sekarang? Taip /kongsi {v['id']}")
    for v in state["senarai"]:
        if state["group_id"] and v.get("group_pada") and not v.get("group_dikongsi") and v["group_pada"] <= t:
            kongsi_ke_group(state, v)
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
