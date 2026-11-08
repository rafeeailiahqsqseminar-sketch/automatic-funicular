#!/bin/bash
# Usage: tools/tambah_muzik.sh VIDEO.mp4 MUZIK.mp3 OUT.mp4 [MUSIC_DB=-14]
# Lays background music under the video's soft wooshes (fade in 1 s, fade out 3 s), video stream copied as-is.
V="$1"; M="$2"; O="$3"; DB="${4:--14}"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
ffmpeg -v error -y -i "$V" -stream_loop -1 -i "$M" -filter_complex \
 "[1:a]atrim=0:$D,volume=${DB}dB,afade=t=in:d=1,afade=t=out:st=$(python3 -c "print($D-3)"):d=3,aresample=48000,aformat=channel_layouts=stereo[m];[0:a][m]amix=inputs=2:normalize=0:duration=first[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$O" && echo "$O"
