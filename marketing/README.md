# Estate Tea marketing assets

Not part of the website build. Kept here so nothing is lost between sessions.

- `poster/` – the "Meet Brew" poster (`brew-poster.html` is the source; render it at 1080×1350 with a 2× device scale).
- `brew-promo/` – the Brew promo video.
  - `brew-promo-v8.html` – the animation (current cut; script in brew-promo-script.md). Open with `?v` for the 9:16 version. `render(t)` draws the frame at time t.
  - `brew-promo-v8-16x9.mp4`, `brew-promo-v8-9x16.mp4` – finished videos with voiceover, music and sound effects.
  - `audio/` – voice lines (Gemini TTS, voice "Aoede", via `gen.py`), `lines.json` (script and timings),
    `score2.py` (the cinematic score), `mix.py` ( sound effects, ducking, final mix → `soundtrack.wav`), `timeline.json` (event times from the animation).

## v9 — Brew speaking (male voice, first person)
- `brew-promo-v9.html` (same animation as v8; opening line "Estate Tea · Premium tea for your everyday chai."),
  `brew-promo-v9-16x9.mp4`, `brew-promo-v9-9x16.mp4`.
- Voice: Gemini voice "Achird", one continuous read (`audio/script-brew.txt`), cut into `audio/brew-voice/l1–l7.wav`;
  timings in `audio/lines-brew.json`. Rebuild: `LINES=lines-brew.json VOICE_DIR=brew-voice OUT=soundtrack-brew.wav python3 mix.py`.
- v8 (female narrator, third person) is kept alongside.

## v10 — fine-tuned (current)
- `brew-promo-v10-16x9.mp4`, `brew-promo-v10-9x16.mp4`: v9 picture, re-mixed sound.
- Voice lines evenly spaced (~0.85 s), each processed like a recorded voice and matched at -19 LUFS; small room.
- Rebuild: `python3 score2.py && SFX=.36 MUSIC=.66 LINES=lines-brew.json VOICE_DIR=brew-voice OUT=soundtrack-brew2.wav python3 mix.py`.

## v11 — picture synced to Brew's voice (current)
- `brew-promo-v11.html`: panel lengths follow Brew's lines; each panel opens as he starts its line.
- `brew-promo-v11-16x9.mp4`, `brew-promo-v11-9x16.mp4`.
- Rebuild sound: `cp timeline11.json timeline.json && python3 score2.py && SFX=.36 MUSIC=.66 LINES=lines-brew11.json VOICE_DIR=brew-voice OUT=soundtrack-brew11.wav python3 mix.py`.
