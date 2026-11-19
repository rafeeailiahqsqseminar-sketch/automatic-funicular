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

Post terus ke TikTok (TikTok Content Posting API):
  - /sambungtiktok      -> pautan untuk benarkan bot post ke akaun TikTok Cikgu
  - /autotiktok on|off  -> hidup / matikan auto-post
  - /privasitiktok awam|kawan|sendiri
  - /statustiktok, /putustiktok

Skrip ini dijalankan oleh GitHub Actions dan berjaga selama ~5.5 jam setiap kali
(long polling), jadi mesej dibalas serta-merta. Bila tamat, larian seterusnya terus mengambil alih.
Hanya pustaka standard Python digunakan.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import subprocess
import sys
import time
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
    "tiktok_auth": None,        # token TikTok, disulitkan (lihat sulit())
    "tiktok_auto": False,
    "tiktok_privasi": "PUBLIC_TO_EVERYONE",
    "tiktok_oauth_state": None,
}
LEWAT_GROUP = timedelta(minutes=30)  # beri masa Cikgu post ke TikTok dulu


# ---------------------------------------------------------------- Telegram API
def api(method, **params):
    token = os.environ["TELEGRAM_TOKEN"]
    data = urllib.parse.urlencode(
        {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in params.items() if v is not None}
    ).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}", data=data)
    with urllib.request.urlopen(req, timeout=70) as r:
        res = json.loads(r.read())
    if not res.get("ok"):
        raise RuntimeError(f"{method}: {res}")
    return res["result"]


def send(chat_id, text, **kw):
    # Telegram hadkan 4096 aksara setiap mesej
    for i in range(0, max(len(text), 1), 4000):
        api("sendMessage", chat_id=chat_id, text=text[i:i + 4000], **kw)


# ---------------------------------------------------------------- TikTok API
TIKTOK_API = "https://open.tiktokapis.com"
TIKTOK_SCOPE = "user.info.basic,video.publish"
PRIVASI = {"awam": "PUBLIC_TO_EVERYONE", "kawan": "MUTUAL_FOLLOW_FRIENDS", "sendiri": "SELF_ONLY"}
NAMA_PRIVASI = {v: k for k, v in PRIVASI.items()} | {"FOLLOWER_OF_CREATOR": "pengikut"}
_semak_seterusnya = {}  # publish_id -> masa semakan status seterusnya (tidak disimpan ke repo)


class TikTokRalat(Exception):
    def __init__(self, kod, mesej=""):
        super().__init__(f"{kod}: {mesej}")
        self.kod, self.mesej = kod, mesej


def tiktok_dikonfigur():
    return bool(os.environ.get("TIKTOK_CLIENT_KEY") and os.environ.get("TIKTOK_CLIENT_SECRET"))


def redirect_uri():
    u = os.environ.get("TIKTOK_REDIRECT_URI", "").strip()
    if u:
        return u
    repo = os.environ.get("GITHUB_REPOSITORY")
    return f"https://github.com/{repo}" if repo else None


# Token disimpan dalam jadual.json (yang di-commit ke repo), jadi ia disulitkan
# dengan kunci daripada secret TIKTOK_CLIENT_SECRET + TELEGRAM_TOKEN.
def _kunci():
    return hashlib.sha256(f"{os.environ['TIKTOK_CLIENT_SECRET']}|{os.environ['TELEGRAM_TOKEN']}".encode()).digest()


def _aliran(kunci, nonce, n):
    out = bytearray()
    i = 0
    while len(out) < n:
        out += hashlib.sha256(kunci + nonce + i.to_bytes(8, "big")).digest()
        i += 1
    return bytes(out[:n])


def sulit(obj):
    kunci, nonce = _kunci(), os.urandom(16)
    data = json.dumps(obj).encode()
    ct = bytes(a ^ b for a, b in zip(data, _aliran(kunci, nonce, len(data))))
    tag = hmac.new(kunci, nonce + ct, hashlib.sha256).digest()
    return base64.b64encode(nonce + tag + ct).decode()


def buka(teks):
    try:
        raw = base64.b64decode(teks)
        nonce, tag, ct = raw[:16], raw[16:48], raw[48:]
        kunci = _kunci()
        if not hmac.compare_digest(tag, hmac.new(kunci, nonce + ct, hashlib.sha256).digest()):
            return None
        return json.loads(bytes(a ^ b for a, b in zip(ct, _aliran(kunci, nonce, len(ct)))))
    except Exception:
        return None


def tiktok_http(method, path, body=None, form=None, token=None):
    headers, data = {}, None
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json; charset=UTF-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(TIKTOK_API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            res = json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            res = json.loads(e.read())
        except Exception:
            raise TikTokRalat(f"http_{e.code}", str(e))
    err = res.get("error")
    if isinstance(err, dict):  # API kandungan: {"data": ..., "error": {"code": "ok"}}
        if err.get("code") not in (None, "ok"):
            raise TikTokRalat(err["code"], err.get("message", ""))
        return res.get("data") or {}
    if err:  # API OAuth: {"error": "invalid_grant", "error_description": ...}
        raise TikTokRalat(err, res.get("error_description", ""))
    return res


def _oauth(**form):
    return tiktok_http("POST", "/v2/oauth/token/", form={
        "client_key": os.environ["TIKTOK_CLIENT_KEY"], "client_secret": os.environ["TIKTOK_CLIENT_SECRET"], **form})


def simpan_token(state, res):
    t = time.time()
    state["tiktok_auth"] = sulit({
        "access_token": res["access_token"],
        "expires_at": t + int(res.get("expires_in", 86400)) - 300,
        "refresh_token": res["refresh_token"],
        "refresh_expires_at": t + int(res.get("refresh_expires_in", 31536000)),
        "open_id": res.get("open_id"),
    })


def access_token(state):
    if not tiktok_dikonfigur():
        raise TikTokRalat("tiada_secret", "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET belum ditambah")
    auth = buka(state["tiktok_auth"]) if state.get("tiktok_auth") else None
    if not auth:
        raise TikTokRalat("belum_sambung", "taip /sambungtiktok")
    if time.time() < auth["expires_at"]:
        return auth["access_token"]
    res = _oauth(grant_type="refresh_token", refresh_token=auth["refresh_token"])
    simpan_token(state, res)
    return res["access_token"]


def nama_akaun(state):
    d = tiktok_http("GET", "/v2/user/info/?fields=open_id,display_name", token=access_token(state))
    return (d.get("user") or {}).get("display_name") or "akaun TikTok"


def potong_caption(teks, had=2200):
    # TikTok kira panjang caption dalam unit UTF-16
    b = (teks or "").encode("utf-16-le")[: had * 2]
    return b.decode("utf-16-le", errors="ignore")


def file_dari(msg):
    media = msg.get("video") or msg.get("document") or {}
    return media.get("file_id"), media.get("mime_type") or "video/mp4"


def muat_turun_video(v):
    if not v.get("file_id"):
        # video lama tiada file_id: forward senyap untuk dapatkan file_id, kemudian padam semula
        m = api("forwardMessage", chat_id=v["chat_id"], from_chat_id=v["chat_id"], message_id=v["message_id"],
                disable_notification=True)
        try:
            api("deleteMessage", chat_id=v["chat_id"], message_id=m["message_id"])
        except Exception:
            pass
        v["file_id"], v["mime"] = file_dari(m)
        if not v["file_id"]:
            raise TikTokRalat("tiada_video", "video asal tidak dijumpai dalam chat")
    try:
        f = api("getFile", file_id=v["file_id"])
    except urllib.error.HTTPError as e:
        if e.code == 400:
            raise TikTokRalat("terlalu_besar", "Telegram hanya benarkan bot muat turun video 20MB ke bawah")
        raise
    url = f"https://api.telegram.org/file/bot{os.environ['TELEGRAM_TOKEN']}/{f['file_path']}"
    with urllib.request.urlopen(url, timeout=300) as r:
        return r.read()


def post_ke_tiktok(state, v):
    """Muat naik video ke TikTok (Direct Post). Pulangkan (publish_id, privasi)."""
    token = access_token(state)
    info = tiktok_http("POST", "/v2/post/publish/creator_info/query/", body={}, token=token)
    pilihan = info.get("privacy_level_options") or []
    privasi = state.get("tiktok_privasi") or "PUBLIC_TO_EVERYONE"
    if pilihan and privasi not in pilihan:
        privasi = "SELF_ONLY" if "SELF_ONLY" in pilihan else pilihan[0]
    video = muat_turun_video(v)

    def init(p):
        return tiktok_http("POST", "/v2/post/publish/video/init/", token=token, body={
            "post_info": {
                "title": potong_caption(v["caption"]),
                "privacy_level": p,
                "disable_comment": bool(info.get("comment_disabled")),
                "disable_duet": bool(info.get("duet_disabled")),
                "disable_stitch": bool(info.get("stitch_disabled")),
            },
            # Video Telegram paling besar 20MB, jadi sentiasa satu chunk sahaja
            "source_info": {"source": "FILE_UPLOAD", "video_size": len(video), "chunk_size": len(video),
                            "total_chunk_count": 1},
        })

    try:
        d = init(privasi)
    except TikTokRalat as e:
        # app yang belum lulus audit TikTok hanya boleh post sebagai Private
        if e.kod.startswith("unaudited_client") and privasi != "SELF_ONLY":
            privasi = "SELF_ONLY"
            d = init(privasi)
        else:
            raise
    req = urllib.request.Request(d["upload_url"], data=video, method="PUT", headers={
        "Content-Type": v.get("mime") or "video/mp4",
        "Content-Length": str(len(video)),
        "Content-Range": f"bytes 0-{len(video) - 1}/{len(video)}",
    })
    try:
        urllib.request.urlopen(req, timeout=300).read()
    except urllib.error.HTTPError as e:
        raise TikTokRalat(f"muat_naik_{e.code}", "TikTok tolak fail video")
    return d["publish_id"], privasi


def sebab(e):
    if isinstance(e, TikTokRalat):
        if e.kod in ("invalid_grant", "access_token_invalid", "scope_not_authorized", "belum_sambung"):
            return "sambungan TikTok tamat atau dibatalkan. Taip /sambungtiktok untuk sambung semula"
        if e.kod == "spam_risk_too_many_posts":
            return "TikTok hadkan bilangan post sehari"
        return f"{e.mesej or e.kod} ({e.kod})"
    return str(e)


def semak_status_tiktok(state):
    t = time.time()
    for v in state["senarai"]:
        pid = v.get("tiktok_publish_id")
        if v.get("tiktok_status") != "proses" or t < _semak_seterusnya.get(pid, 0):
            continue
        _semak_seterusnya[pid] = t + 30
        try:
            d = tiktok_http("POST", "/v2/post/publish/status/fetch/", body={"publish_id": pid},
                            token=access_token(state))
        except Exception as e:
            print(f"Semak status TikTok #{v['id']}: {e}", file=sys.stderr, flush=True)
            continue
        status = d.get("status")
        if status == "PUBLISH_COMPLETE":
            v["tiktok_status"] = "siap"
            send(v["chat_id"], f"✅ #{v['id']} {v['tajuk']} sudah dipost ke TikTok.")
        elif status == "FAILED":
            v["tiktok_status"] = "gagal"
            send(v["chat_id"], f"⚠️ TikTok gagal post #{v['id']} ({d.get('fail_reason')}). Sila post sendiri:")
            peringatan_manual(v)
        elif now() - datetime.fromisoformat(v["dihantar_pada"]).replace(tzinfo=MYT) > timedelta(minutes=30):
            v["tiktok_status"] = "tak_pasti"
            send(v["chat_id"], f"⏳ #{v['id']} {v['tajuk']} masih diproses TikTok selepas 30 minit. "
                               "Semak dalam app TikTok.")


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
            "file_id": file_dari(msg)[0],
            "mime": file_dari(msg)[1],
            "slot": next_free_slot(state, now(), taken),
            "dihantar": False,
        }
        state["next_id"] += 1
        state["senarai"].append(item)
        nota = "" if item["caption"] else "\n(Tiada caption. Reply video ini dengan caption TikTok.)"
        send(chat_id, f"✅ #{item['id']} {item['tajuk']}\n📅 {fmt(item['slot'])}{nota}",
             reply_to_message_id=msg["message_id"])
        return

    if text.startswith("http") and "code=" in text and state.get("tiktok_oauth_state"):
        terima_kod_tiktok(state, chat_id, text)
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
             "/group - lihat group\n/putus - putuskan group\n\n"
             "Post terus ke TikTok:\n/sambungtiktok - sambung akaun TikTok\n/autotiktok on|off - hidup/matikan auto-post\n"
             "/privasitiktok awam|kawan|sendiri\n/statustiktok - status sambungan\n/putustiktok - putuskan TikTok")
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
    elif cmd == "/sambungtiktok":
        if not tiktok_dikonfigur():
            send(chat_id, "Secret TIKTOK_CLIENT_KEY dan TIKTOK_CLIENT_SECRET belum ditambah di GitHub. "
                          "Ikut langkah dalam bot-tiktok/README.md.")
        elif not redirect_uri():
            send(chat_id, "TIKTOK_REDIRECT_URI belum ditetapkan.")
        else:
            state["tiktok_oauth_state"] = secrets.token_urlsafe(16)
            url = "https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode({
                "client_key": os.environ["TIKTOK_CLIENT_KEY"], "scope": TIKTOK_SCOPE, "response_type": "code",
                "redirect_uri": redirect_uri(), "state": state["tiktok_oauth_state"]})
            send(chat_id, "🔗 Sambung TikTok:\n\n"
                          "1. Tekan pautan di bawah.\n"
                          "2. Log masuk TikTok dan tekan Authorize (Benarkan).\n"
                          "3. Satu halaman lain akan terbuka. Salin alamat penuh di bar alamat (bermula dengan https).\n"
                          "4. Tampal alamat itu di sini dan hantar.\n\n" + url,
                 disable_web_page_preview=True)
    elif cmd == "/autotiktok":
        pilih = (args[0].lower() if args else "")
        if pilih not in ("on", "off", "hidup", "mati"):
            send(chat_id, f"Auto-post sekarang: {'ON' if state.get('tiktok_auto') else 'OFF'}.\nContoh: /autotiktok on")
        elif pilih in ("on", "hidup") and not state.get("tiktok_auth"):
            send(chat_id, "Sambung TikTok dulu: /sambungtiktok")
        else:
            state["tiktok_auto"] = pilih in ("on", "hidup")
            send(chat_id, "🤖 Auto-post ON. Bila tiba masa, saya post sendiri ke TikTok." if state["tiktok_auto"]
                 else "Auto-post OFF. Saya hantar peringatan sahaja, Cikgu post sendiri.")
    elif cmd == "/privasitiktok":
        p = PRIVASI.get(args[0].lower()) if args else None
        if not p:
            send(chat_id, f"Privasi sekarang: {NAMA_PRIVASI.get(state.get('tiktok_privasi'), '?')}.\n"
                          "Contoh: /privasitiktok awam  (atau kawan, sendiri)")
        else:
            state["tiktok_privasi"] = p
            send(chat_id, f"🔒 Privasi post TikTok: {args[0].lower()}.")
    elif cmd == "/statustiktok":
        if not state.get("tiktok_auth"):
            send(chat_id, "TikTok belum disambung. Taip /sambungtiktok")
        else:
            try:
                nama = nama_akaun(state)
                send(chat_id, f"🎵 Disambung ke: {nama}\nAuto-post: {'ON' if state.get('tiktok_auto') else 'OFF'}\n"
                              f"Privasi: {NAMA_PRIVASI.get(state.get('tiktok_privasi'), '?')}")
            except Exception as e:
                send(chat_id, f"⚠️ {sebab(e)}")
    elif cmd == "/putustiktok":
        auth = buka(state["tiktok_auth"]) if state.get("tiktok_auth") and tiktok_dikonfigur() else None
        if auth:
            try:
                tiktok_http("POST", "/v2/oauth/revoke/", form={
                    "client_key": os.environ["TIKTOK_CLIENT_KEY"], "client_secret": os.environ["TIKTOK_CLIENT_SECRET"],
                    "token": auth["access_token"]})
            except Exception:
                pass
        state["tiktok_auth"] = None
        state["tiktok_auto"] = False
        send(chat_id, "TikTok diputuskan. Auto-post OFF.")
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


def terima_kod_tiktok(state, chat_id, text):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(text.strip()).query)
    kod, st = (q.get("code") or [None])[0], (q.get("state") or [None])[0]
    if not kod or st != state.get("tiktok_oauth_state"):
        send(chat_id, "Pautan ini tidak sepadan. Taip /sambungtiktok dan cuba semula dengan pautan yang baru.")
        return
    state["tiktok_oauth_state"] = None
    try:
        simpan_token(state, _oauth(grant_type="authorization_code", code=kod, redirect_uri=redirect_uri()))
        state["tiktok_auto"] = True
        try:
            nama = nama_akaun(state)
        except Exception:
            nama = "akaun TikTok"
        send(chat_id, f"✅ Disambung ke {nama}.\n🤖 Auto-post ON: bila tiba masa, saya post terus ke TikTok.\n"
                      "Matikan bila-bila masa: /autotiktok off")
    except Exception as e:
        send(chat_id, f"⚠️ Gagal sambung TikTok: {sebab(e)}. Taip /sambungtiktok untuk cuba semula.")


def peringatan_manual(v):
    api("copyMessage", chat_id=v["chat_id"], from_chat_id=v["chat_id"], message_id=v["message_id"],
        caption=f"🔔 Masa posting TikTok!\n#{v['id']} {v['tajuk']}")
    send(v["chat_id"], v["caption"] or "(Tiada caption)")


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
        if state.get("tiktok_auto") and state.get("tiktok_auth"):
            try:
                pid, privasi = post_ke_tiktok(state, v)
                v["tiktok_publish_id"], v["tiktok_status"] = pid, "proses"
                nota = ("\n🔒 Dipost sebagai Private kerana app TikTok belum lulus audit."
                        if privasi == "SELF_ONLY" and state.get("tiktok_privasi") != "SELF_ONLY" else "")
                send(v["chat_id"], f"📤 #{v['id']} {v['tajuk']} sedang dipost ke TikTok. "
                                   f"Saya beritahu bila siap.{nota}")
            except Exception as e:
                print(f"Gagal post TikTok #{v['id']}: {e}", file=sys.stderr, flush=True)
                send(v["chat_id"], f"⚠️ Gagal post #{v['id']} ke TikTok: {sebab(e)}.\nSila post sendiri:")
                peringatan_manual(v)
        else:
            peringatan_manual(v)
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
def simpan(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
    print("Jadual dikemaskini.", flush=True)
    if os.environ.get("BOT_GIT_PUSH"):  # dalam GitHub Actions: simpan terus ke repo
        cmds = [["git", "add", str(STATE_FILE)], ["git", "commit", "-qm", "Kemaskini jadual TikTok [skip ci]"],
                ["git", "pull", "-q", "--rebase"], ["git", "push", "-q"]]
        for c in cmds:
            r = subprocess.run(c, capture_output=True, text=True)
            if r.returncode:
                print(f"Gagal simpan ({' '.join(c)}): {r.stderr.strip()}", file=sys.stderr, flush=True)
                return


def main():
    token = os.environ.get("TELEGRAM_TOKEN", "").strip()
    if not token:
        sys.exit("RALAT: secret TELEGRAM_TOKEN kosong. Tambah di Settings > Secrets and variables > Actions.")
    os.environ["TELEGRAM_TOKEN"] = token
    try:
        me = api("getMe")
    except urllib.error.HTTPError as e:
        if e.code in (401, 404):
            sys.exit("RALAT: Telegram tolak TELEGRAM_TOKEN (salah token). Salin semula token dari @BotFather.")
        raise
    print(f"Bot: @{(me or {}).get('username')}", flush=True)

    state = {**DEFAULT_STATE, **json.loads(STATE_FILE.read_text())} if STATE_FILE.exists() else dict(DEFAULT_STATE)

    # BOT_LAMA_MINIT: berapa lama bot berjaga dan balas serta-merta (0 = semak sekali sahaja)
    lama = float(os.environ.get("BOT_LAMA_MINIT", "0"))
    tamat = time.time() + lama * 60
    while True:
        asal = json.dumps(state, sort_keys=True)
        try:
            # long polling: Telegram tahan sambungan sehingga 50 saat dan pulangkan mesej sebaik ia masuk
            updates = api("getUpdates", offset=state["offset"], timeout=50 if lama else 0,
                          allowed_updates=["message"])
            for u in updates:
                state["offset"] = u["update_id"] + 1
                if "message" in u:
                    try:
                        handle(state, u["message"])
                    except Exception as e:  # satu mesej rosak jangan hentikan bot
                        print(f"Ralat mesej {u['update_id']}: {e}", file=sys.stderr, flush=True)
            hantar_yang_tiba(state)
            if state.get("tiktok_auth") and tiktok_dikonfigur():
                semak_status_tiktok(state)
        except Exception as e:  # rangkaian terputus dll: cuba lagi
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
