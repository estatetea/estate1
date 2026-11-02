# Estate Tea marketing assets

Not part of the website build. Kept here so nothing is lost between sessions.

- `poster/` – the "Meet Brew" poster (`brew-poster.html` is the source; render it at 1080×1350 with a 2× device scale).
- `brew-promo/` – the Brew promo video.
  - `brew-promo-v3.html` – the animation. Open with `?v` for the 9:16 version. `render(t)` draws the frame at time t.
  - `brew-promo-v4-16x9.mp4`, `brew-promo-v4-9x16.mp4` – finished videos with voiceover, music and sound effects.
  - `audio/` – voice lines (Gemini TTS, voice "Aoede", via `gen.py`), `lines.json` (script and timings),
    `mix.py` (composed music, sound effects, ducking, final mix → `soundtrack.wav`), `timeline.json` (event times from the animation).
