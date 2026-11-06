#!/bin/bash
# Usage: mix_music.sh SRC.mov MUSIC.m4a DURATION OUT.wav [MUSIC_DB=-22]
# Cleans + loudnorms the voice, lays background music under it (fade in 1 s, fade out 3 s). Output goes to final_render.sh as voice.wav.
SRC="$1";M="$2";D="$3";O="$4";DB="${5:--22}"
ffmpeg -v error -y -i "$SRC" -af "highpass=f=80,afftdn=nf=-28:nt=w,lowpass=f=12000,loudnorm=I=-14:TP=-1.5:LRA=9" -ar 48000 -ac 2 "$O.voice.wav"
ffmpeg -v error -y -i "$O.voice.wav" -i "$M" -filter_complex "[1:a]atrim=0:$D,volume=${DB}dB,afade=t=in:d=1,afade=t=out:st=$(python3 -c "print($D-3)"):d=3,aresample=48000,aformat=channel_layouts=stereo[m];[0:a][m]amix=inputs=2:normalize=0:duration=first" "$O"
rm -f "$O.voice.wav"; echo "$O"
