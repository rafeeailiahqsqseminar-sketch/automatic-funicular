#!/bin/bash
# Usage: final_render.sh SRC.mov SEQ_DIR voice.wav sfx.wav DURATION OUT_BASENAME
# voice.wav = cleaned + loudnorm'd voice. Scales source to 1080x1920, overlays graphics, mixes soft wooshes.
# Writes OUT.mp4 (crf 20) and OUT_tg.mp4 (<9 MB: 720p; video bitrate auto from duration).
SRC="$1";SEQ="$2";V="$3";X="$4";D="$5";O="$6"
SW=$(ffprobe -v error -select_streams v -show_entries stream=width -of csv=p=0 "$SRC");SH=$(ffprobe -v error -select_streams v -show_entries stream=height -of csv=p=0 "$SRC")
H2=$(python3 -c "h=round(1080*$SH/$SW/2)*2;print(max(h,1920))");CY=$(python3 -c "print(int(($H2-1920)*0.35))")
ffmpeg -v error -y -i "$SRC" -framerate 30 -i "$SEQ/%05d.png" -i "$V" -i "$X" -filter_complex \
"[0:v]fps=30,scale=1080:$H2:flags=lanczos,crop=1080:1920:0:$CY,setsar=1[b];[b][1:v]overlay=eof_action=pass:format=auto,format=yuv420p[v];\
[2:a][3:a]amix=inputs=2:normalize=0:duration=first,afade=t=in:d=0.15,afade=t=out:st=$(python3 -c "print($D-0.62)"):d=0.6,alimiter=limit=0.84[a]" \
-map "[v]" -map "[a]" -t $(python3 -c "print($D-0.02)") -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -movflags +faststart "$O.mp4"
VB=$(python3 -c "print(max(250,int(8.3*8192/$D-64)))")
ffmpeg -v error -y -i "$O.mp4" -vf scale=720:1280 -c:v libx264 -b:v ${VB}k -maxrate $((VB*5/4))k -bufsize $((VB*5/2))k -c:a aac -b:a 64k -movflags +faststart "${O}_tg.mp4"
ls -la "$O.mp4" "${O}_tg.mp4"; ffmpeg -hide_banner -i "$O.mp4" -af ebur128 -f null - 2>&1 | grep -A1 "Integrated" | tail -1
