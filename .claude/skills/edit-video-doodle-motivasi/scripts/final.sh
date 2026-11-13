#!/usr/bin/env bash
# Final mix + render + end clip.
# usage: final.sh BASE.mp4 OVERLAY.mov VOICE SONG SONG_START SFX.wav DUR OUT.mp4 [END.mov]
#   VOICE      ElevenLabs mp3 (use "none" for no voice)
#   SONG       background song (use "none" for no music); SONG_START = seconds to skip (silent intro)
#   END.mov    defaults to the skill's assets/end.mov (Cikgu Rafee follow/link-bio clip); "none" to skip
set -e
BASE=$1; OV=$2; VOICE=$3; SONG=$4; SS=$5; SFX=$6; DUR=$7; OUT=$8
HERE=$(cd "$(dirname "$0")" && pwd); END=${9:-$HERE/../assets/end.mov}
TMP=$(mktemp -d)
FO=$(python3 -c "print(max(0,$DUR-2))")
IN=(); F=""; n=0; MIX=""
if [ "$VOICE" != none ]; then
  ffmpeg -v error -y -i "$VOICE" -af "aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=70,loudnorm=I=-15:TP=-2:LRA=9,apad" -t $DUR $TMP/voice.wav
  IN+=(-i $TMP/voice.wav); F="[$n:a]asplit[v1][v2];"; MIX="[v1]"; VI=$n; n=$((n+1))
fi
if [ "$SONG" != none ]; then
  IN+=(-ss $SS -t $DUR -i "$SONG"); F="$F[$n:a]aresample=48000,afade=t=in:d=0.5,afade=t=out:st=$FO:d=2,volume=0.30[m];"
  if [ -n "$VI" ]; then F="$F[m][v2]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=450[md];"; else F="$F[m]anull[md];"; fi
  MIX="$MIX[md]"; n=$((n+1))
elif [ -n "$VI" ]; then F="$F[v2]anullsink;"; fi
IN+=(-i "$SFX"); MIX="$MIX[$n:a]"; n=$((n+1))
ffmpeg -v error -y "${IN[@]}" -filter_complex "${F}${MIX}amix=inputs=$(echo "$MIX" | grep -o '\[' | wc -l):normalize=0,loudnorm=I=-14:TP=-1.5:LRA=10[a]" -map "[a]" -ar 48000 -t $DUR $TMP/mix.wav
ffmpeg -v error -y -i "$BASE" -i "$OV" -i $TMP/mix.wav -filter_complex "[0:v][1:v]overlay=format=auto,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 19 -preset fast -c:a aac -b:a 192k -t $DUR $TMP/main.mp4
if [ "$END" != none ] && [ -f "$END" ]; then
  ffmpeg -v error -y -i $TMP/main.mp4 -i "$END" -filter_complex "\
[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p[ev];[0:v]setsar=1,format=yuv420p[mv];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-14:TP=-1.5:LRA=9[ea];[0:a]aresample=48000[ma];\
[mv][ma][ev][ea]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 19 -preset fast -c:a aac -b:a 192k -movflags +faststart "$OUT"
else
  ffmpeg -v error -y -i $TMP/main.mp4 -c copy -movflags +faststart "$OUT"
fi
rm -rf $TMP
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT"
ffmpeg -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
