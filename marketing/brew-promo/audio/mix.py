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


sfx = np.zeros(N)
P = TL['POSTER_IN']; S = TL['STOPS']; OUT = TL['OUT']; MERGE = TL['MERGE']
# opening: the video flies into the phone; the chat loads
add(sfx, whoosh(1.0, up=False, bright=.8), P[0] - .05, .8)
for k in range(5): add(sfx, pop(760 + 60 * k), P[1] - .25 + k * .09 + .05, .35)
for s in S:
    add(sfx, whoosh(0.6 if s['i'] == 0 else 0.5, up=True), s['move'][0] - .05, .9)       # camera move
    add(sfx, pop(520, .09), s['glow'], .5)                                              # feature lights up
    add(sfx, whoosh(0.55, up=True, bright=1.3), s['open'][0] - .05, .7)                 # panel opens
    add(sfx, whoosh(0.45, up=False, bright=1.0), s['close'][0] - .02, .55)              # panel folds back
add(sfx, whoosh(0.8, up=False, bright=.7), OUT[0], .7)
add(sfx, whoosh(0.9, up=True, bright=.6), MERGE[0], .6)
add(sfx, chime((1046.5, 1568.0, 2093.0), 1.8), MERGE[1] - .05, .7)


def at(i, x): return S[i]['play'] + x * S[i].get('k', 1)     # a moment inside panel i (panels run faster than written)

def typing(i, a, b, text):
    chars = len(text); t0, t1 = at(i, a), at(i, b) - .3 * S[i].get('k', 1)
    for c in range(chars):
        if text[c] != ' ': add(sfx, tick(), t0 + (t1 - t0) * c / max(1, chars), .9)
    add(sfx, swoosh_send(), at(i, b), 1.0)

def bubble(i, x, f=900): add(sfx, pop(f), at(i, x), .55)

# Each panel's moments, matching brew-promo-v5.html
typing(0, .5, 2.8, 'How do I make the perfect masala chai?'); bubble(0, 4.2)
for k in range(4): bubble(0, 4.6 + k * .55, 700); add(sfx, pop(1200, .05), at(0, 4.6 + k * .55 + .45), .35)
typing(1, .4, 1.9, 'One 500 g pack, please'); bubble(1, 3.0)
add(sfx, tap(), at(1, 4.2), 1.0); bubble(1, 6.6, 1050); bubble(1, 7.5)
add(sfx, chime(), at(1, 9.6), .9); bubble(1, 9.6)
bubble(2, .3, 700)
for k in range(5): bubble(2, .9 + k * .3, 650 + 40 * k)
typing(2, 2.4, 4.0, 'Hi! Same as last time, please'); bubble(2, 5.2)
typing(2, 6.6, 7.4, 'Yes please'); bubble(2, 8.1)
bubble(3, .6); add(sfx, pop(1400, .08), at(3, 2.3), .5); add(sfx, whoosh(.3, up=False, bright=1.4), at(3, 2.3), .35)
for x in (.4, .9, 2.4, 5.6): add(sfx, pop(1100, .05), at(3, x), .35)
bubble(3, 5.8); add(sfx, chime((1318.5, 1760.0), .9), at(3, 5.8), .5)
typing(3, 6.8, 8.2, "Thank you, it's perfect!")

# ---------------- music: the cinematic score (score.py, stereo) ----------------
score = np.load('score.npy')[:N]
if len(score) < N: score = np.vstack([score, np.zeros((N - len(score), 2))])

# ---------------- voiceover ----------------
lines = json.load(open('lines.json'))
voice = np.zeros(N)
for L in lines:
    src = f"{L['id']}.wav"
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]))
    tempo = max(1.0, d / L['max'])          # only ever speed up a touch to fit its scene
    raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', src, '-af', f'atempo={tempo:.3f},aresample={SR}', '-f', 's16le', '-ac', '1', '-'])
    v = np.frombuffer(raw, np.int16).astype(float) / 32768
    add(voice, v / (np.max(np.abs(v)) + 1e-9) * .9, L['at'])

# ---------------- mix: duck the music under the voice ----------------
envv = np.abs(voice)
win = int(.12 * SR); envv = np.convolve(envv, np.ones(win) / win, 'same')
duck = 1 - .55 * np.clip(envv / .04, 0, 1)
duck = np.convolve(duck, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')   # smooth release
centre = sfx * .55 + voice * 1.0
stereo = score * duck[:, None] * .9 + centre[:, None]
stereo /= np.max(np.abs(stereo)) + 1e-9
with wave.open('soundtrack-raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((stereo * 32000).astype(np.int16).tobytes())
# loudness for social video
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'soundtrack-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), 'soundtrack.wav'], check=True)
print('soundtrack.wav', round(DUR, 2), 's')
