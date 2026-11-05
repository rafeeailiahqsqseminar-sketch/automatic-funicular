#!/bin/bash
# Usage: caption_strips.sh SRC.mov OUTDIR [crop_y] [crop_h]
# Reads burned-in captions: 2 fps strips of the caption band, 4x30 tiles per minute, with timestamps.
# Read each capN.png to get the transcript + times (label = time in the source video).
# Then refine pop times at 10 fps:  ffmpeg -ss T-0.4 -t 1.6 ... fps=10 ... tile=16x1
SRC="$1";OUT="$2";Y="${3:-460}";H="${4:-80}";F=/usr/share/fonts/opentype/inter/Inter-Bold.otf;mkdir -p "$OUT"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC");M=$(python3 -c "import math;print(math.ceil($D/60))")
W=$(ffprobe -v error -select_streams v -show_entries stream=width -of csv=p=0 "$SRC")
for ((i=0;i<M;i++)); do ffmpeg -v error -y -ss $((i*60)) -t 60 -i "$SRC" -vf "fps=2,crop=$W:$H:0:$Y,scale=352:-2,drawtext=fontfile=$F:text='%{pts\:hms\:$((i*60))}':x=2:y=2:fontsize=13:fontcolor=red,tile=4x30" -frames:v 1 "$OUT/cap$i.png"; done
ls "$OUT"
