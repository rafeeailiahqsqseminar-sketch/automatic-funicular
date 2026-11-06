"""Usage: python3 person_matte.py IN.mp4 MODEL.tflite OUT_fg.webm
Cuts the person out of every frame (MediaPipe selfie segmenter) and writes a VP9 webm WITH alpha.
In Remotion: footage -> big text -> this cutout on top = text BEHIND the head.
Model: storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"""
import subprocess, sys, json
import numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
src, model, out = sys.argv[1:4]
info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', src]))['streams'][0]
W, H = info['width'], info['height']
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO, output_confidence_masks=True))
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                        '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '24', '-row-mt', '1', '-deadline', 'realtime', '-cpu-used', '6', out],
                       stdin=subprocess.PIPE)
prev = None; n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    rgb = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    r = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)), int(n * 1000 / 30))
    a = 1.0 - r.confidence_masks[0].numpy_view().astype(np.float32)  # class 0 = background
    a = np.clip((a - 0.35) / 0.3, 0, 1)  # tighten the soft edge
    if prev is not None: a = 0.6 * a + 0.4 * prev  # less flicker
    prev = a
    rgba = np.dstack([rgb, (a * 255).astype(np.uint8)])
    enc.stdin.write(rgba.tobytes()); n += 1
enc.stdin.close(); enc.wait(); print('frames', n)
