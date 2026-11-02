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


def typing(a, b, text, play):
    chars = len(text); dur = (b - .3) - a
    for k in range(chars):
        if text[k] != ' ': add(sfx, tick(), play + a + dur * k / max(1, chars), .9)
    add(sfx, swoosh_send(), play + b, 1.0)


def bubble(at, play, f=900): add(sfx, pop(f), play + at, .55)


# Each panel's moments (seconds after the panel opens), matching brew-promo-v3.html
p0, p1, p2, p3 = (s['play'] for s in S)
typing(.5, 2.8, 'How do I make the perfect masala chai?', p0); bubble(4.2, p0)
for i in range(4): bubble(4.6 + i * .55, p0, 700); add(sfx, pop(1200, .05), p0 + 4.6 + i * .55 + .45, .35)
typing(.4, 1.9, 'One 500 g pack, please', p1); bubble(3.0, p1)
add(sfx, tap(), p1 + 4.2, 1.0); bubble(6.6, p1, 1050); bubble(7.5, p1)
add(sfx, chime(), p1 + 9.6, .9); bubble(9.6, p1)
bubble(.3, p2, 700)
for i in range(5): bubble(.9 + i * .3, p2, 650 + 40 * i)
typing(2.4, 4.0, 'Hi! Same as last time, please', p2); bubble(5.2, p2)
typing(6.6, 7.4, 'Yes please', p2); bubble(8.1, p2)
bubble(.6, p3); add(sfx, pop(1400, .08), p3 + 2.3, .5); add(sfx, whoosh(.3, up=False, bright=1.4), p3 + 2.3, .35)
for at in (.4, .9, 2.4, 5.6): add(sfx, pop(1100, .05), p3 + at, .35)
bubble(5.8, p3); add(sfx, chime((1318.5, 1760.0), .9), p3 + 5.8, .5)
typing(6.8, 8.2, "Thank you, it's perfect!", p3)

# ---------------- music: warm lo-fi bed, 90 BPM ----------------
BPM = 90; beat = 60 / BPM
def note(f, d, kind='keys'):
    n = int(d * SR); t = np.arange(n) / SR
    if kind == 'keys':   # soft electric piano: sine + gentle bell partial, slow decay
        y = (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + .08 * np.sin(2 * np.pi * 3.5 * f * t) * np.exp(-t * 6))
        y *= np.exp(-t * 1.1) * env(n, .01, .08)
    elif kind == 'pluck':   # Karplus-Strong guitar
        p = int(SR / f); buf = rng.uniform(-1, 1, p); y = np.zeros(n)
        for k in range(n):
            y[k] = buf[k % p]; buf[k % p] = .5 * (buf[k % p] + buf[(k + 1) % p]) * .996
        y *= env(n, .002, .05)
    else:  # bass
        y = np.sin(2 * np.pi * f * t) * env(n, .01, .1) * np.exp(-t * .8)
    return y

hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# Fmaj7 - Em7 - Dm7 - Cmaj7 (warm, unresolved, loops nicely)
CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
music = np.zeros(N)
bar = 4 * beat
nbars = int(DUR / bar) + 1
for b in range(nbars):
    ch = CHORDS[b % 4]; t0 = b * bar
    for m in ch: add(music, note(hz(m + 12), bar * 1.05, 'keys'), t0, .09)
    add(music, note(hz(ch[0] - 12), bar * .95, 'bass'), t0, .22)
    arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 24, ch[3] + 12, ch[2] + 12, ch[0] + 24]
    for k, m in enumerate(arp):
        if b >= 1: add(music, note(hz(m), beat * .9, 'pluck'), t0 + k * beat / 2, .09)
    if b >= 2:   # soft beat: kick on 1 and 3, brushed hat on offbeats
        for k in range(4):
            if k % 2 == 0:
                n = int(.25 * SR); tt = np.arange(n) / SR
                add(music, np.sin(2 * np.pi * (55 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9), t0 + k * beat, .32)
            h = rng.standard_normal(int(.06 * SR)); h = (h - lowpass(h, 6000)) * np.exp(-np.arange(len(h)) / SR * 70)
            add(music, h, t0 + k * beat + beat / 2, .05)
music = lowpass(music, 7000)
# fade in from the opening, out at the very end
fi = t2i(2.0); music[:fi] *= np.linspace(0, 1, fi)
fo = t2i(2.5); music[-fo:] *= np.linspace(1, 0, fo)

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
duck = 1 - .62 * np.clip(envv / .04, 0, 1)
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
