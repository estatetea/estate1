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

# ---------------- music: cinematic score ----------------
# Slow and atmospheric over the tea pour, a riser into a hit as the poster forms, then a driving pulse
# (staccato strings, deep drums) through the features, and a final hit with a long tail on the ending.
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def saw_stack(f, d, detune=(-7, 0, 7), bright=2200):
    n = int(d * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for c in detune:
        ff = f * 2 ** (c / 1200); ph = (t * ff) % 1.0; y += 2 * ph - 1
    return lowpass(y / len(detune), bright)
def pad(f, d, att=1.2, rel=1.5, bright=1600):
    n = int(d * SR); y = saw_stack(f, d, (-9, -3, 3, 9), bright)
    e = np.minimum(1, np.arange(n) / (att * SR)); r = int(min(n, rel * SR)); e[-r:] *= np.linspace(1, 0, r)
    return y * e
def piano(f, d):
    n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*2*f*t)*np.exp(-t*2) + .12*np.sin(2*np.pi*3*f*t)*np.exp(-t*4)
    return y * np.exp(-t * 1.4) * env(n, .004, .3)
def stab(f, d):          # staccato string
    n = int(d * SR); y = saw_stack(f, d, (-6, 0, 6), 3000); t = np.arange(n) / SR
    return y * np.exp(-t * 14) * env(n, .003, .02)
def taiko(d=.6):
    n = int(d * SR); t = np.arange(n) / SR
    body = np.sin(2*np.pi*(48 + 70*np.exp(-t*25))*t) * np.exp(-t*6)
    skin = rng.standard_normal(n) * np.exp(-t*40) * .25
    return (body + lowpass(skin, 1800)) * .9
def impact(d=3.0):
    n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2*np.pi*(38 + 40*np.exp(-t*8))*t) * np.exp(-t*1.6)
    crash = lowpass(rng.standard_normal(n), 5000) * np.exp(-t*2.5) * .35
    return (sub + crash) * env(n, .002)
def riser(d):
    n = int(d * SR); t = np.linspace(0, 1, n); x = rng.standard_normal(n)
    y = lowpass(x, 200 + 7000 * t**2) * t**2
    tone = np.sin(2*np.pi*np.cumsum(220 + 660*t**2)/SR) * t**3 * .25
    return (y * .6 + tone)

music = np.zeros(N)
P0 = TL['POSTER_IN'][0]; S0 = TL['STOPS'][0]['move'][0]; ENDT = TL['END']; M1 = TL['MERGE'][1]
# 1) Opening (0 -> poster): slow, warm, atmospheric: low pad + sparse piano (D minor colour)
add(music, pad(hz(38), P0 + .6, att=1.5, rel=.6, bright=900), 0, .35)
add(music, pad(hz(50), P0 + .6, att=2.0, rel=.6, bright=1200), 0, .18)
for k, (m, at) in enumerate([(62, .3), (65, 1.3), (69, 2.3), (67, 3.2)]):
    add(music, piano(hz(m), 2.2), at, .28)
add(music, riser(1.6), P0 - 1.55, .55)
add(music, impact(3.2), P0 - .02, 1.0)                      # the hit as the video flies into the poster
# 2) Main pulse: 124 BPM, Dm - Bb - F - C, staccato strings in 8ths + taiko + low pad
BPM = 124; beat = 60 / BPM; bar = 4 * beat
CH = [[50, 53, 57], [46, 50, 53], [41, 45, 48], [48, 52, 55]]
start = P0 + .05; stop_ = TL['OUT'][0]
b = 0; t0 = start
while t0 < stop_:
    ch = CH[b % 4]
    add(music, pad(hz(ch[0] - 12), bar + .2, att=.3, rel=.3, bright=1100), t0, .22)
    for m in ch: add(music, pad(hz(m + 12), bar + .2, att=.4, rel=.3, bright=1800), t0, .05)
    pattern = [ch[0], ch[0], ch[1], ch[0], ch[2], ch[0], ch[1], ch[2]]
    for k, m in enumerate(pattern):
        add(music, stab(hz(m + 12), beat * .45), t0 + k * beat / 2, .16 if t0 > S0 - .1 else .09)
    for k in range(4):
        if t0 > S0 - .2 or k == 0:
            add(music, taiko(), t0 + k * beat, .5 if k in (0, 2) else .28)
    if b % 2 == 1 and t0 > S0:   # fill on the last 8th of every other bar
        add(music, taiko(.3), t0 + 3.5 * beat, .3)
    b += 1; t0 += bar
# 3) Ending: riser, big hit on the merge, warm held chord with a long tail
add(music, riser(1.2), TL['MERGE'][0] - .25, .5)
add(music, impact(4.0), M1 - .1, 1.0)
for m, g in ((38, .3), (50, .16), (57, .1), (62, .1), (65, .08)):
    add(music, pad(hz(m), ENDT - M1 + .4, att=.08, rel=2.4, bright=1500), M1 - .1, g)
add(music, piano(hz(74), 3.0), M1 + .05, .3); add(music, piano(hz(69), 3.0), M1 + .05, .2)
# room: a short, simple reverb (decaying noise convolution would be heavy; use a few echoes)
wet = np.zeros(N)
for dly, g in ((.043, .35), (.071, .28), (.113, .22), (.167, .16), (.239, .1)):
    i = int(dly * SR); wet[i:] += music[:-i] * g
music = lowpass(music + wet * .6, 9000)
fo = t2i(.6); music[-fo:] *= np.linspace(1, 0, fo)

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
mix = music * duck * 1.0 + sfx * .55 + voice * 1.0
mix /= np.max(np.abs(mix)) + 1e-9
stereo = np.stack([mix, mix], 1)
# gentle width for music/sfx: tiny delay on one side
stereo[:, 1] = np.concatenate([np.zeros(int(.0006 * SR)), mix])[:N]
with wave.open('soundtrack-raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((stereo * 32000).astype(np.int16).tobytes())
# loudness for social video
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'soundtrack-raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), 'soundtrack.wav'], check=True)
print('soundtrack.wav', round(DUR, 2), 's')
