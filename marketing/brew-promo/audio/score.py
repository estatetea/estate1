"""Premium cinematic score for the Brew promo (stereo), on the video's own timeline.

  0 - ~3.7 s   soft opening: low string pad and a few piano notes under "Every great cup starts with a conversation."
  ~3.7 - 4.2   the sound falls away to silence
  4.2          a deep hit as the video flies into the poster; strings bloom, a cello pulse starts
  the stops    the score builds stop by stop (more strings, octaves, booms, reverse swells into each move)
  the end      a final hit and a warm, wide D major chord ringing out
"""
import json, wave
import numpy as np

SR = 48000
TL = json.load(open('timeline.json'))
DUR = TL['END'] + 0.2
N = int(DUR * SR)
rng = np.random.default_rng(11)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
t2i = lambda t: int(max(0, t) * SR)

L = np.zeros(N); R = np.zeros(N)


def place(sig, t, gain=1.0, pan=0.0):
    i = t2i(t); j = min(N, i + len(sig))
    if j <= i: return
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:j] += sig[: j - i] * gain * gl * 1.414; R[i:j] += sig[: j - i] * gain * gr * 1.414


def spectral_lp(x, cutoff, slope=2.0):
    """Smooth low-pass via FFT (fast for long buffers)."""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** (2 * slope))
    return np.fft.irfft(X, len(x))


# One-cycle wavetables (additive): bowed string and a rounder cello
def table(partials):
    ph = np.arange(4096) / 4096
    w = sum(a * np.sin(2 * np.pi * k * ph) for k, a in partials); return w / np.max(np.abs(w))
STRING = table([(k, (1 / k) * np.exp(-k / 9)) for k in range(1, 16)])
CELLO = table([(k, (1 / k ** 1.3) * np.exp(-k / 6)) for k in range(1, 12)])
PIANO = table([(1, 1), (2, .45), (3, .18), (4, .08), (5, .04)])


def osc(tab, f, n, vib=0.0035, vrate=5.2, detune_c=0.0):
    t = np.arange(n) / SR
    ff = f * 2 ** (detune_c / 1200) * (1 + vib * np.sin(2 * np.pi * vrate * t + rng.uniform(0, 6.28)) * np.minimum(1, t / .6))
    ph = (np.cumsum(ff) / SR + rng.uniform()) % 1.0
    return tab[(ph * 4096).astype(int) % 4096]


def string_note(m, d, att=.6, rel=1.0, voices=4, bright=3200):
    n = int((d + rel) * SR)
    y = sum(osc(STRING, hz(m), n, detune_c=c) for c in np.linspace(-9, 9, voices)) / voices
    e = np.minimum(1, np.arange(n) / (att * SR)) ** 1.5
    r = int(rel * SR); e[-r:] *= np.linspace(1, 0, r) ** 2
    return spectral_lp(y * e, bright)


def pulse_note(m, d=.22):
    n = int((d + .25) * SR); t = np.arange(n) / SR
    y = (osc(CELLO, hz(m), n, vib=0) + .6 * osc(CELLO, hz(m) * 1.003, n, vib=0)) / 1.6
    e = np.minimum(1, t / .008) * np.exp(-t * 7.5)
    return spectral_lp(y * e, 1800)


def piano_note(m, d=2.6):
    n = int(d * SR); t = np.arange(n) / SR
    y = osc(PIANO, hz(m), n, vib=0) * np.exp(-t * 1.6) * np.minimum(1, t / .004)
    y += .25 * osc(PIANO, hz(m) * 2.001, n, vib=0) * np.exp(-t * 3)
    return y


def boom(d=2.5, f0=36):
    n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * (f0 * t + 30 * (1 - np.exp(-t * 9)) / 9)) * np.exp(-t * 2.2)
    y += spectral_lp(rng.standard_normal(n), 900) * np.exp(-t * 14) * .5
    return y * np.minimum(1, t / .002)


def big_hit(d=4.5):
    n = int(d * SR); t = np.arange(n) / SR
    y = boom(d, 32) * 1.2
    y += spectral_lp(rng.standard_normal(n), 6000) * np.exp(-t * 3.2) * .35     # cymbal-ish wash
    return y


def reverse_swell(d=.9):
    n = int(d * SR); t = np.arange(n) / SR
    y = spectral_lp(rng.standard_normal(n), 5000) * np.exp(-t * 4)
    y += .4 * osc(STRING, hz(74), n, vib=0) * np.exp(-t * 3)
    return y[::-1] * .6


S = TL['STOPS']; P0 = TL['POSTER_IN'][0]; M0, M1 = TL['MERGE']; END = TL['END']

# ---------- 1) the soft opening, then silence ----------
QUIET_AT = 3.65
for m, g, pan in ((38, .5, 0), (50, .32, -.3), (57, .22, .3), (62, .16, .1)):
    place(string_note(m, QUIET_AT - .2, att=1.4, rel=.35, voices=3, bright=1500), 0, g, pan)
for m, at in ((74, .35), (78, 1.25), (81, 2.15), (79, 2.9)):
    place(piano_note(m, 2.0), at, .22, .25)
pre = np.zeros(N); pre[:] = 1
fade = slice(t2i(QUIET_AT - .35), t2i(QUIET_AT)); pre[fade] = np.linspace(1, 0, fade.stop - fade.start) ** 2
pre[t2i(QUIET_AT):] = 0
L *= pre; R *= pre

# ---------- 2) the hit and the main score ----------
place(big_hit(), P0 - .02, .95, 0)
BPM = 100; beat = 60 / BPM; bar = 4 * beat
# D - Bm - G - A, voiced warm and wide (low, mid, high strings)
PROG = [(38, [50, 57, 62, 66]), (35, [47, 54, 59, 62]), (31, [43, 50, 55, 59]), (33, [45, 52, 57, 61])]
t0 = P0; b = 0; stop_out = TL['OUT'][0] + .3
section = lambda t: sum(1 for s in S if t >= s['move'][0])      # 0..4: the score grows stop by stop
while t0 < stop_out:
    root, ch = PROG[b % 4]; sec = section(t0)
    place(string_note(root, bar, att=.25, rel=.6, voices=3, bright=900), t0, .55, 0)               # basses
    for k, m in enumerate(ch):
        place(string_note(m, bar, att=.5 if b else .9, rel=.7, voices=4, bright=2600), t0, .15, (-.6, -.2, .2, .6)[k])
    if sec >= 2:   # violins an octave up join
        for k, m in enumerate(ch[1:]): place(string_note(m + 12, bar, att=.7, rel=.8, voices=4, bright=4200), t0, .07 + .02 * (sec - 2), (-.5, 0, .5)[k])
    # cello pulse in 8ths: root, root, octave, root ... (the forward motion)
    for k in range(8):
        m = root + 12 + (12 if k in (2, 6) else 0)
        place(pulse_note(m), t0 + k * beat / 2, (.16 if sec == 0 else .24) * (1.15 if k % 2 == 0 else .85), -.15)
    # a deep boom on each downbeat once the features start; a softer one mid-bar later on
    if sec >= 1: place(boom(), t0, .5, 0)
    if sec >= 3: place(boom(1.6, 44), t0 + 2 * beat, .28, 0)
    # piano motif every other bar, high and sparse
    if b % 2 == 0:
        for k, m in enumerate((ch[3] + 12, ch[2] + 12, ch[1] + 24)):
            place(piano_note(m, 2.2), t0 + k * beat * 1.5, .15, .35)
    b += 1; t0 += bar
# reverse swells into each camera move, a hit as each feature arrives
for s in S:
    place(reverse_swell(.9), s['move'][0] - .9, .55, 0)
    place(boom(2.0, 40), s['glow'], .45, 0)

# ---------- 3) the ending ----------
place(reverse_swell(1.2), M1 - 1.2, .7, 0)
place(big_hit(5.0), M1 - .05, 1.0, 0)
for k, m in enumerate((38, 50, 57, 62, 66, 69, 74, 78)):
    place(string_note(m, END - M1 + .3, att=.12, rel=2.5, voices=4, bright=3600), M1 - .05, (.5, .3, .18, .15, .12, .1, .08, .06)[k], (-.7 + .2 * k))
for m, at in ((78, 0.05), (81, .55), (86, 1.1)):
    place(piano_note(m, 3.0), M1 + at, .2, .3)

# ---------- concert-hall reverb (stereo, ~3.4 s) ----------
irn = int(3.4 * SR); ti = np.arange(irn) / SR
def ir():
    x = rng.standard_normal(irn) * np.exp(-ti / .75)
    x = spectral_lp(x, 7000) * .5 + spectral_lp(x, 2500) * .5
    x[: int(.012 * SR)] = 0; return x / np.sqrt(np.sum(x ** 2))
def conv(x, h):
    n = len(x) + len(h); size = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)[: len(x)]
wetL, wetR = conv(L, ir()), conv(R, ir())
outL, outR = L * .75 + wetL * .55, R * .75 + wetR * .55
# the opening really stops: nothing (not even the reverb tail) between the soft opening and the hit
g = np.ones(N); a0, a1 = t2i(QUIET_AT - .25), t2i(QUIET_AT + .05)
g[a0:a1] = np.linspace(1, 0, a1 - a0) ** 2; g[a1:t2i(P0 - .03)] = 0
outL *= g; outR *= g
# keep the very end clean
fo = t2i(.5); outL[-fo:] *= np.linspace(1, 0, fo); outR[-fo:] *= np.linspace(1, 0, fo)
st = np.stack([outL, outR], 1)
st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.4) / np.tanh(1.4)       # gentle glue
np.save('score.npy', st.astype(np.float32))
with wave.open('score.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 30000).astype(np.int16).tobytes())
print('score.wav', round(DUR, 2), 's; silence from', QUIET_AT, 'to', P0)
