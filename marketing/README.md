# Estate Tea marketing assets

Not part of the website build. Kept here so nothing is lost between sessions.

- `poster/` – the "Meet Brew" poster (`brew-poster.html` is the source; render it at 1080×1350 with a 2× device scale).
- `brew-promo/` – the Brew promo video.
  - `brew-promo-v5.html` – the animation (40 s cut; v3 is the longer 55 s cut). Open with `?v` for the 9:16 version. `render(t)` draws the frame at time t.
  - `brew-promo-v6-16x9.mp4`, `brew-promo-v6-9x16.mp4` – finished videos with voiceover, music and sound effects.
  - `audio/` – voice lines (Gemini TTS, voice "Aoede", via `gen.py`), `lines.json` (script and timings),
    `score.py` (the cinematic score), `mix.py` ( sound effects, ducking, final mix → `soundtrack.wav`), `timeline.json` (event times from the animation).
