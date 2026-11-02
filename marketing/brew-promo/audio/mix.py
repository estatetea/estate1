"""Sound for the Brew promo: composed music bed, synthesised sound effects, the voiceover, ducking and the final mix.
Everything is placed on the video's own timeline (timeline.json), so 16:9 and 9:16 share one soundtrack."""
import json, subprocess, wave
import numpy as np

SR = 48000
TL = json.load(open('timeline.json'))
DUR = TL['END'] + 0.2
N = int(DUR * SR)
rng = np.random.default_rng(7)


def t2i(t): return int(max(0, t) * SR)


def add(track, sig, t, gain=1.0):
    i = t2i(t); j = min(len(track), i + len(sig))
    if j > i: track[i:j] += sig[: j - i] * gain


def env(n, attack=0.005, release=None):
    e = np.ones(n)
    a = max(1, int(attack * SR)); e[:a] = np.linspace(0, 1, a)
    if release:
        r = min(n, int(release * SR)); e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be an array (a sweep)."""
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); s = 0.0
    for k in range(len(x)):
        s += a[k] * (x[k] - s); y[k] = s
    return y


# ---------------- sound effects ----------------
def whoosh(d=0.55, up=True, bright=1.0):
    n = int(d * SR); x = rng.standard_normal(n)
    t = np.linspace(0, 1, n)
    sweep = (300 + 5200 * bright * (t if up else 1 - t) ** 1.6)
    y = lowpass(x, sweep) - lowpass(x, sweep * 0.25)          # band-pass-ish moving band
    shape = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.5             # swell in and out
    return y * shape * 0.9


def pop(f0=880, d=0.07):
    n = int(d * SR); t = np.arange(n) / SR
    f = f0 * (1 - 0.35 * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 55) * 0.5


def tick():
    n = int(0.012 * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 600)
    return (x - lowpass(x, 1500)) * 0.18


def tap():
    n = int(0.09 * SR); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 45)
    click = rng.standard_normal(n) * np.exp(-t * 400) * 0.3
    return (thump * 0.6 + click) * 0.7


def chime(freqs=(1318.5, 1975.5), d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + i)) / (i + 1) for i, f in enumerate(freqs))
    return y * env(n, 0.003) * 0.35


def swoosh_send():  # a short airy "sent"
    return whoosh(0.22, up=True, bright=1.2) * 0.6


def msg_swoosh(d=.28, pitch=1.0):
    """A soft "message sent" swoosh: a short airy rise with a tiny bright tail (not a cinematic whoosh)."""
    n = int(d * SR); t = np.linspace(0, 1, n); x = rng.standard_normal(n)
    band = lowpass(x, 2500 + 6000 * t * pitch) - lowpass(x, 900 + 2500 * t * pitch)
    tail = np.sin(2 * np.pi * np.cumsum(1200 * pitch + 900 * t) / SR) * np.exp(-((t - .8) / .12) ** 2) * .25
    return (band * np.sin(np.pi * t) ** 2 + tail) * .5

def ping(f=1568, d=.35):          # a phone notification
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 1.5 * tt)) * np.exp(-tt * 9) * env(n, .002) * .35

sfx = np.zeros(N)
P = TL['POSTER_IN']; S = TL['STOPS']; OUT = TL['OUT']; MERGE = TL['MERGE']
SW = .32                                                      # overall swoosh level (kept well under the music and voice)
add(sfx, msg_swoosh(.45, .7), P[0] - .1, SW)                  # the video flies into the phone
for k in range(5): add(sfx, pop(760 + 60 * k), P[1] - .25 + k * .09 + .05, .25)
for s in S:
    add(sfx, msg_swoosh(.3, 1.0), s['move'][0] - .05, SW)     # camera move
    add(sfx, msg_swoosh(.25, 1.3), s['open'][0] - .03, SW * .8)   # panel opens
    add(sfx, msg_swoosh(.22, .8), s['close'][0], SW * .6)     # panel folds back
add(sfx, msg_swoosh(.35, .8), OUT[0], SW)
add(sfx, chime((1046.5, 1568.0, 2093.0), 1.8), MERGE[1] - .05, .45)


def at(i, x): return S[i]['play'] + x * S[i].get('k', 1)     # a moment inside panel i (panels run faster than written)

def typing(i, a, b, text):
    chars = len(text); t0, t1 = at(i, a), at(i, b) - .3 * S[i].get('k', 1)
    for c in range(chars):
        if text[c] != ' ': add(sfx, tick(), t0 + (t1 - t0) * c / max(1, chars), .7)
    add(sfx, msg_swoosh(.22, 1.4), at(i, b), .45)             # "sent"

def bubble(i, x, f=900): add(sfx, pop(f), at(i, x), .42)

# Each panel's moments, matching brew-promo-v7.html
typing(0, .5, 2.8, 'How do I make the perfect masala chai?'); bubble(0, 4.2)
for k in range(4): bubble(0, 4.6 + k * .55, 700); add(sfx, pop(1200, .05), at(0, 4.6 + k * .55 + .45), .28)
typing(1, .4, 1.9, 'One 500 g pack, please'); bubble(1, 3.0)
add(sfx, tap(), at(1, 4.2), .8); bubble(1, 6.6, 1050); bubble(1, 7.5)
add(sfx, chime(), at(1, 9.6), .7); bubble(1, 9.6)
bubble(2, .3, 700)
for k in range(5): bubble(2, .9 + k * .3, 650 + 40 * k)
typing(2, 2.4, 4.0, 'Hi! Same as last time, please'); bubble(2, 5.2)
typing(2, 6.6, 7.4, 'Yes please'); bubble(2, 8.1)
# delivery: email / SMS notifications on the lock screen (no WhatsApp), and the timeline ticking over
for x, f in ((.6, 1568), (2.3, 1760), (5.6, 1568)): add(sfx, ping(f), at(3, x), 1.0)
for x in (.4, .9, 2.4, 5.6): add(sfx, pop(1100, .05), at(3, x), .28)

# ---------------- music: the cinematic score (score.py, stereo) ----------------
score = np.load('score.npy')[:N]
if len(score) < N: score = np.vstack([score, np.zeros((N - len(score), 2))])

# ---------------- voiceover ----------------
import os
lines = json.load(open(os.environ.get('LINES', 'lines.json')))
voice = np.zeros(N)
for L in lines:
    src = os.path.join(os.environ.get('VOICE_DIR', '.'), f"{L['id']}.wav")
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]))
    tempo = max(1.0, d / L['max'])          # only ever speed up a touch to fit its scene
    raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', src, '-af', f'atempo={tempo:.3f},aresample={SR}', '-f', 's16le', '-ac', '1', '-'])
    v = np.frombuffer(raw, np.int16).astype(float) / 32768
    add(voice, v / (np.max(np.abs(v)) + 1e-9) * .9, L['at'])

# ---------------- mix: duck the music under the voice ----------------
envv = np.abs(voice)
win = int(.12 * SR); envv = np.convolve(envv, np.ones(win) / win, 'same')
duck = 1 - .5 * np.clip(envv / .04, 0, 1)
duck = np.convolve(duck, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')   # smooth release
centre = sfx * .5 + voice * 1.05
stereo = score * duck[:, None] * .9 + centre[:, None]
stereo /= np.max(np.abs(stereo)) + 1e-9
with wave.open('soundtrack-raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((stereo * 32000).astype(np.int16).tobytes())
# loudness for social video
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'soundtrack-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), os.environ.get('OUT', 'soundtrack.wav')], check=True)
print('soundtrack.wav', round(DUR, 2), 's')
