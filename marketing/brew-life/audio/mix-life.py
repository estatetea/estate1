"""Soundtrack for 'Brew in real life': the cinematic score (score2.py), sound effects placed from the video's own
event list, and the voice (same chain and ducking as the poster video). Usage: python3 mix-life.py brew|narr"""
import json, os, subprocess, sys, wave
import numpy as np
V = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(HERE, '../../audio')
work = os.path.join(HERE, 'work-' + V); os.makedirs(work, exist_ok=True); os.chdir(work)
T = json.load(open(os.path.join(HERE, f'tl-{V}.json')))
S = T['SCENES']; ES = T['END_START']
# the score's own timeline: the hit at the first scene, a braam on every cut, the final hit as Estate Tea appears
json.dump({'END': T['END'], 'POSTER_IN': [T['TITLE_END'], T['TITLE_END'] + .8], 'STOPS': [{'move': [s['start']]} for s in S[1:]],
           'OUT': [ES - 1.6, ES - .7], 'MERGE': [ES - .5, ES + .35]}, open('timeline.json', 'w'))
subprocess.run([sys.executable, os.path.join(A, 'score2.py')], check=True, stdout=subprocess.DEVNULL)
src = open(os.path.join(A, 'mix.py')).read()
exec(src[:src.index('sfx = np.zeros(N)')])          # SR, N, add(), whoosh/pop/tick/tap/chime/msg_swoosh/ping
sfx = np.zeros(N); SW = .32
def bell():                                         # a two-tone doorbell
    return np.concatenate([chime((1318.5, 2637), .45)[:int(.42 * SR)], chime((1046.5, 2093), 1.2)]) * 1.2
for e in T['EVENTS']:
    k, t = e['k'], e['t']
    if k in ('cut', 'swap'): add(sfx, msg_swoosh(.45, .7), t, SW)
    elif k == 'phone': add(sfx, msg_swoosh(.3, 1.0), t, SW * .8)
    elif k == 'type':
        for c in range(e['n']):
            if c % 1 == 0: add(sfx, tick(), t + (e['t1'] - t) * c / e['n'], .6)
    elif k == 'sent': add(sfx, msg_swoosh(.22, 1.4), t, .45)
    elif k == 'recv': add(sfx, pop(900), t, .42)
    elif k == 'paid': add(sfx, tap(), t - .08, .8); add(sfx, chime(), t, .6)
    elif k == 'lid': add(sfx, pop(520, .09), t, .5); add(sfx, tick(), t + .02, 1.0)
    elif k == 'bell': add(sfx, bell(), t, .7)
    elif k == 'ping': add(sfx, ping(1568), t, 1.0)
    elif k == 'chime': add(sfx, chime((1046.5, 1568.0, 2093.0), 1.8), t, .45)
score = np.load('score.npy')[:N]
if len(score) < N: score = np.vstack([score, np.zeros((N - len(score), 2))])
VCHAIN = ('highpass=f=75,lowpass=f=13000,equalizer=f=170:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=1.2,'
          'acompressor=threshold=-24dB:ratio=2.5:attack=8:release=140:makeup=2,loudnorm=I=-19:TP=-3:LRA=7')
voice = np.zeros(N)
for L in T['LINES']:
    raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', os.path.join(HERE, V, L['id'] + '.wav'), '-af', f'{VCHAIN},aresample={SR}', '-f', 's16le', '-ac', '1', '-'])
    v = np.frombuffer(raw, np.int16).astype(float) / 32768; f = int(.02 * SR); v[:f] *= np.linspace(0, 1, f); v[-f:] *= np.linspace(1, 0, f)
    add(voice, v, L['at'])
rn = int(.3 * SR); rt = np.arange(rn) / SR; room = rng.standard_normal(rn) * np.exp(-rt / .07); room = lowpass(room, 5000); room[:int(.006 * SR)] = 0; room /= np.sqrt(np.sum(room ** 2))
size = 1 << (N + rn - 1).bit_length(); voice = voice + np.fft.irfft(np.fft.rfft(voice, size) * np.fft.rfft(room, size), size)[:N] * .11
envv = np.convolve(np.abs(voice), np.ones(int(.15 * SR)) / int(.15 * SR), 'same'); duck = 1 - .86 * np.clip(envv / .02, 0, 1)
k = int(.35 * SR); duck = np.convolve(np.pad(duck, (k // 2, k - k // 2 - 1), mode='edge'), np.ones(k) / k, 'valid')
stems = {'voice': voice, 'music': score * duck[:, None] * .66, 'sfx': sfx * .36}
st = stems['music'] + (stems['voice'] + stems['sfx'])[:, None]; peak = np.max(np.abs(st)) + 1e-9; st /= peak
for name, x in stems.items():
    x = x / peak; x = x if x.ndim == 2 else np.stack([x, x], 1)
    with wave.open(f'stem-{name}.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32000).astype(np.int16).tobytes())
with wave.open('raw.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32000).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), os.path.join(HERE, f'soundtrack-{V}.wav')], check=True)
# voice over music while speaking, per line
SRr = SR; m = stems['music'].mean(1); win = int(.05 * SR); ve = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, 'same')); act = ve > .02
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print(V, round(T['END'], 2), 's ·', ' '.join(f"{L['id']} {db(voice[int(L['at']*SR):int((L['at']+8)*SR)][act[int(L['at']*SR):int((L['at']+8)*SR)]]) - db(m[int(L['at']*SR):int((L['at']+8)*SR)][act[int(L['at']*SR):int((L['at']+8)*SR)]]):.1f}dB" for L in T['LINES']))
