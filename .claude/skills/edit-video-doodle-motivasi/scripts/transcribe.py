#!/usr/bin/env python3
"""Word timestamps for the voice-over (faster-whisper small, CPU).
usage: transcribe.py VOICE(.mp3/.wav) OUT.json [lang=ms] [prompt]
Needs: pip install faster-whisper  (model downloads from Hugging Face on first run)"""
import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
lang = sys.argv[3] if len(sys.argv) > 3 else 'ms'
prompt = sys.argv[4] if len(sys.argv) > 4 else None
# decode with ffmpeg ourselves (the bundled PyAV can be incompatible)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
m = WhisperModel('small', device='cpu', compute_type='int8')
seg, _ = m.transcribe(a, language=lang, word_timestamps=True, initial_prompt=prompt)
words = [dict(w=w.word.strip(), s=round(w.start, 2), e=round(w.end, 2)) for s in seg for w in s.words]
json.dump(words, open(out, 'w'), ensure_ascii=False)
print(' '.join(f"{w['w']}@{w['s']}" for w in words))
