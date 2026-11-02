"""Cinematic, thrilling score for the Brew promo (stereo), locked to the video's cuts.

  0 - 4.2 s   dark low drone under the tea pour; from ~2.4 s a riser and a filtered string ostinato fade in and open up
              (no stop: the slow part grows into the main score)
  4.2 s       a deep braam + hit as the video flies into the poster; the main score starts at 128 BPM
  the cuts    a braam hit on every camera move, a tom fill leading into each one; the score builds section by section
  the end     riser, a final braam + hit as Estate Tea comes together, a long tail
"""
import json, wave
import numpy as np

SR = 48000
TL = json.load(open('timeline.json'))
DUR = TL['END'] + 0.2
N = int(DUR * SR)
rng = np.random.default_rng(23)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
t2i = lambda t: int(max(0, t) * SR)
L = np.zeros(N); R = np.zeros(N)


def place(sig, t, gain=1.0, pan=0.0, lane=None):
    i = t2i(t); j = min(N, i + len(sig))
    if j <= i: return
    gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    (lane or (L, R))[0][i:j] += sig[: j - i] * gain * gl; (lane or (L, R))[1][i:j] += sig[: j - i] * gain * gr


def lp(x, cutoff, slope=2.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / cutoff) ** (2 * slope)); return np.fft.irfft(X, len(x))


def hp(x, cutoff): return x - lp(x, cutoff, 1.5)


def table(partials):
    ph = np.arange(4096) / 4096; w = sum(a * np.sin(2 * np.pi * k * ph) for k, a in partials); return w / np.max(np.abs(w))
STRING = table([(k, (1 / k) * np.exp(-k / 10)) for k in range(1, 18)])
SAW = table([(k, 1 / k) for k in range(1, 40)])


def osc(tab, f, n, vib=0.0, detune_c=0.0):
    t = np.arange(n) / SR
    ff = f * 2 ** (detune_c / 1200) * (1 + vib * np.sin(2 * np.pi * 5.3 * t + rng.uniform(0, 6.28)))
    ph = (np.cumsum(ff) / SR + rng.uniform()) % 1.0
    return tab[(ph * 4096).astype(int) % 4096]


# ---------- instruments ----------
def stacc(m, d=.11):                      # staccato string 16th
    n = int((d + .12) * SR); t = np.arange(n) / SR
    y = (osc(STRING, hz(m), n, detune_c=-6) + osc(STRING, hz(m), n, detune_c=6)) / 2
    return y * np.minimum(1, t / .004) * np.exp(-t * 16)


def low_pulse(m, d=.2):                   # driving low string/synth 8th
    n = int((d + .1) * SR); t = np.arange(n) / SR
    y = osc(SAW, hz(m), n) * .6 + osc(SAW, hz(m) * 1.005, n) * .4
    return lp(y * np.minimum(1, t / .006) * np.exp(-t * 9), 420)


def sustain(m, d, att=.5, rel=.8, bright=2800, voices=4):
    n = int((d + rel) * SR)
    y = sum(osc(STRING, hz(m), n, vib=.004, detune_c=c) for c in np.linspace(-10, 10, voices)) / voices
    e = np.minimum(1, np.arange(n) / (att * SR)) ** 1.5; r = int(rel * SR); e[-r:] *= np.linspace(1, 0, r) ** 2
    return lp(y * e, bright)


def braam(d=2.6, root=26):                # big cinematic low-brass "braam"
    n = int(d * SR); t = np.arange(n) / SR
    y = sum(osc(SAW, hz(m), n, detune_c=c) for m in (root, root + 12, root + 19) for c in (-12, 0, 12)) / 9
    y = np.tanh(y * 2.2)
    # filter opens fast, closes slowly: brassy bloom
    seg = int(.05 * SR); out = np.zeros(n)
    for k in range(0, n, seg):
        tt = k / SR; cut = 250 + 2600 * np.exp(-tt * 1.8) * np.minimum(1, tt / .12)
        piece = lp(y[max(0, k - 2048):k + seg], cut)[-(min(seg, n - k)):]
        out[k:k + len(piece)] = piece
    return out * np.minimum(1, t / .03) * np.exp(-t * 1.1)


def taiko(d=.7, f=50):
    n = int(d * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (f * t + 55 * (1 - np.exp(-t * 28)) / 28)) * np.exp(-t * 6)
    skin = lp(rng.standard_normal(n), 2200) * np.exp(-t * 35) * .4
    return (body + skin) * np.minimum(1, t / .001)


def tom(f=110): return taiko(.35, f) * .8


def snare(d=.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp(rng.standard_normal(n), 1200) * np.exp(-t * 18) * .7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * .5)


def tick(d=.05):
    n = int(d * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 6000) * np.exp(-t * 90) * .5


def hit(d=3.5):
    n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (30 * t + 45 * (1 - np.exp(-t * 7)) / 7)) * np.exp(-t * 1.7)
    crash = lp(rng.standard_normal(n), 7000) * np.exp(-t * 2.6) * .35
    return (sub + crash) * np.minimum(1, t / .001)


def riser(d, top=6000):
    n = int(d * SR); x = np.linspace(0, 1, n); noise = rng.standard_normal(n)
    out = np.zeros(n); seg = int(.04 * SR)
    for k in range(0, n, seg):
        cut = 200 + top * x[k] ** 2
        out[k:k + seg] = lp(noise[max(0, k - 2048):k + seg], cut)[-len(out[k:k + seg]):]
    tone = osc(SAW, 1, n) * 0  # placeholder for clarity
    pitch = np.sin(2 * np.pi * np.cumsum(110 + 880 * x ** 2.2) / SR) * .15
    return (out * .7 + lp(pitch, 3000)) * x ** 2.4


# ---------- form ----------
P0 = TL['POSTER_IN'][0]; S = TL['STOPS']; OUT0 = TL['OUT'][0]; M0, M1 = TL['MERGE']; END = TL['END']
BPM = 128; beat = 60 / BPM; bar = 4 * beat
PROG = [(26, [50, 53, 57]), (22, [46, 50, 53]), (19, [43, 46, 50]), (21, [45, 49, 52])]   # Dm  Bb  Gm  A (tension)

# 1) Opening: a dark drone, then the main score fades in underneath and opens up (filtered), into the hit at P0.
place(sustain(26, P0 + .3, att=1.4, rel=.4, bright=500, voices=3), 0, .45)
place(sustain(38, P0 + .3, att=2.0, rel=.4, bright=900, voices=3), 0, .25, -.2)
place(sustain(57, P0 - 1.0, att=2.4, rel=.5, bright=2400), .6, .06, .3)
pre_L = np.zeros(N); pre_R = np.zeros(N)
FADE_IN = 2.4
t0 = P0 - 4 * bar                         # the ostinato is already running before the hit, just hidden
while t0 < P0:
    root, ch = PROG[0]
    for k in range(16):
        if t0 + k * beat / 4 < FADE_IN - .3: continue
        m = ch[[0, 0, 2, 0, 1, 0, 2, 0][k % 8]] + 12
        place(stacc(m), t0 + k * beat / 4, .18, (-.35, .35)[k % 2], lane=(pre_L, pre_R))
    for k in range(8):
        if t0 + k * beat / 2 >= FADE_IN: place(low_pulse(root + 12), t0 + k * beat / 2, .35, 0, lane=(pre_L, pre_R))
    t0 += bar
# open the filter and the volume from FADE_IN to P0
i0, i1 = t2i(FADE_IN), t2i(P0)
for lane in (pre_L, pre_R):
    seg = lane[i0:i1]; n = len(seg); out = np.zeros(n); step = int(.05 * SR)
    for k in range(0, n, step):
        x = k / n; cut = 350 + 5000 * x ** 2
        out[k:k + step] = lp(seg[max(0, k - 2048):k + step], cut)[-len(out[k:k + step]):] * (x ** 1.6)
    lane[i0:i1] = out
L += pre_L; R += pre_R
place(riser(P0 - FADE_IN + .05), FADE_IN, .55)
place(hit(), P0 - .02, .9); place(braam(3.0, 26), P0 - .02, .55)

# 2) Main score, from the hit to the pull-back.
section = lambda t: sum(1 for s in S if t >= s['move'][0] - .05)      # 0 before the first feature, then 1..4
moves = [s['move'][0] for s in S]
t0 = P0; b = 0
while t0 < OUT0 + bar * .5:
    root, ch = PROG[b % 4]; sec = section(t0)
    place(sustain(root + 12, bar, att=.15, rel=.3, bright=700, voices=3), t0, .38)                # low strings
    for k, m in enumerate(ch): place(sustain(m + 12, bar, att=.25, rel=.4, bright=2600), t0, .07 + .015 * sec, (-.5, 0, .5)[k])
    if sec >= 3:
        for k, m in enumerate(ch): place(sustain(m + 24, bar, att=.3, rel=.4, bright=4200), t0, .035, (-.6, 0, .6)[k])
    for k in range(16):                                                                           # 16th ostinato
        m = ch[[0, 0, 2, 0, 1, 0, 2, 0][k % 8]] + 12 + (12 if (sec >= 2 and k % 4 == 3) else 0)
        place(stacc(m), t0 + k * beat / 4, (.16 + .02 * sec) * (1.2 if k % 4 == 0 else .9), (-.35, .35)[k % 2])
    for k in range(8): place(low_pulse(root + 12), t0 + k * beat / 2, .38, 0)                   # low 8th pulse
    # drums: taiko on 1 and the "and" of 2, 3; snare on 2 & 4 from section 2; ticks from section 3
    for at, g in ((0, .9), (1.5, .55), (2, .75), (3.5, .5)):
        place(taiko(), t0 + at * beat, g * (.75 if sec == 0 else 1), 0)
    if sec >= 2:
        for at in (1, 3): place(snare(), t0 + at * beat, .32, .1)
    if sec >= 3:
        for k in range(16): place(tick(), t0 + k * beat / 4, .18 if k % 2 else .3, .3)
    b += 1; t0 += bar
# braam + hit on every cut, with a tom fill and a short riser leading into it
for mt in moves:
    for k in range(6): place(tom(150 - k * 14), mt - .6 + k * .1, .55, (-.4 + k * .16))
    place(riser(.7, 5000), mt - .7, .35)
    place(braam(2.2, 26 if moves.index(mt) % 2 == 0 else 22), mt - .02, .5)
    place(hit(2.2), mt - .02, .45)

# 3) Ending: riser into a final braam + hit as Estate Tea comes together, then a long tail.
place(riser(M1 - OUT0, 7000), OUT0, .5)
for k in range(8): place(tom(160 - k * 10), M1 - .8 + k * .1, .5, (-.5 + k * .14))
place(hit(5.0), M1 - .03, 1.0); place(braam(4.5, 26), M1 - .03, .7)
for k, m in enumerate((26, 38, 45, 50, 53, 57, 62)):
    place(sustain(m, END - M1, att=.05, rel=2.0, bright=3000), M1 - .03, (.4, .3, .15, .12, .1, .08, .06)[k], -.6 + .2 * k)

# ---------- hall reverb ----------
irn = int(2.8 * SR); ti = np.arange(irn) / SR
def ir():
    x = rng.standard_normal(irn) * np.exp(-ti / .6); x = lp(x, 6500); x[: int(.01 * SR)] = 0; return x / np.sqrt(np.sum(x ** 2))
def conv(x, h):
    n = len(x) + len(h); size = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)[: len(x)]
outL, outR = L * .8 + conv(L, ir()) * .38, R * .8 + conv(R, ir()) * .38
fo = t2i(.5); outL[-fo:] *= np.linspace(1, 0, fo); outR[-fo:] *= np.linspace(1, 0, fo)
st = np.stack([outL, outR], 1)
st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.8) / np.tanh(1.8)        # glue / loudness
np.save('score.npy', st.astype(np.float32))
with wave.open('score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 30000).astype(np.int16).tobytes())
print('score.wav', round(DUR, 2), 's')
