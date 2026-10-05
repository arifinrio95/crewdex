# Synthesizes the film's soundtrack: a music bed arranged around the chapter marks, plus sound effects
# placed on the events the director logged.  usage: python3 synth.py events.log <seconds> out.wav
import sys, re, wave
import numpy as np
from scipy import signal

SR = 44100
log, DUR, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
marks, events = {}, []
for line in open(log):
    m = re.match(r'FILM sfx (\S+) ([\d.]+)', line)
    if m: events.append((m.group(1), float(m.group(2)))); continue
    m = re.match(r'FILM ([\d.]+)s (\S+)', line)
    if m: marks[m.group(2)] = float(m.group(1))

def env(n, a=.005, d=.3, curve=4.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-curve * t / d)
def bp(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f): return signal.sosfilt(signal.butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return signal.sosfilt(signal.butter(2, f, 'high', fs=SR, output='sos'), x)
def sweep(n, f0, f1):
    f = np.geomspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def tone(f, n, phase=0): return np.sin(2 * np.pi * f * np.arange(n) / SR + phase)
def secs(s): return int(s * SR)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

music = np.zeros((N, 2)); fx = np.zeros((N, 2))
def put(buf, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    x = x[:N - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l; buf[i:i + len(x), 1] += x * gain * r

# ------------------------------------------------------------------ instruments
def kick():
    n = secs(.32); return sweep(n, 150, 42) * env(n, .001, .22) + tone(60, n) * env(n, .001, .12) * .3
def snare():
    n = secs(.22); return bp(rng.standard_normal(n), 900, 6000) * env(n, .001, .13) * .8 + tone(190, n) * env(n, .001, .07) * .5
def clap():
    n = secs(.25); x = bp(rng.standard_normal(n), 1100, 4500); e = np.zeros(n)
    for k in (0, .011, .023): j = secs(k); e[j:] += env(n - j, .001, .12)
    return x * e * .5
def hat(open_=False):
    n = secs(.3 if open_ else .06); return hp(rng.standard_normal(n), 7500) * env(n, .001, .2 if open_ else .035) * .35
def shaker():
    n = secs(.09); return bp(rng.standard_normal(n), 4500, 9000) * env(n, .02, .06) * .25
def rim():
    n = secs(.06); return (tone(1750, n) + tone(820, n) * .6) * env(n, .001, .025) * .4
def epiano(m, dur, vel=1.0):
    n = secs(dur + .5); t = np.arange(n) / SR; f = hz(m)
    mod = np.sin(2 * np.pi * f * 2 * t) * (1.6 * np.exp(-6 * t) + .25) * vel
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-2.2 * t / max(dur, .2)) * np.minimum(1, t / .004)
    x += np.sin(2 * np.pi * f * 7.01 * t) * np.exp(-40 * t) * .12          # tine
    rel = np.ones(n); k = secs(dur); rel[k:] = np.linspace(1, 0, n - k) ** 2
    return x * rel * .22 * vel
def bass(m, dur):
    n = secs(dur); t = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * t) + .35 * signal.sawtooth(2 * np.pi * f * t)
    x = lp(x, 420) * np.minimum(1, t / .006) * np.exp(-1.8 * t / dur); x[-secs(.02):] *= np.linspace(1, 0, secs(.02))
    return x * .5
def pluck(m, dur=.28, bright=1.0):
    n = secs(dur + .3); t = np.arange(n) / SR; f = hz(m)
    x = signal.sawtooth(2 * np.pi * f * t, .5) * .6 + np.sin(2 * np.pi * f * 2 * t) * .3
    return lp(x, 1800 * bright) * env(n, .003, dur, 5) * .2
def pad(ms, dur):
    n = secs(dur); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for det in (-.07, .06): x += np.sin(2 * np.pi * hz(m + det) * t + rng.uniform(0, 6))
    e = np.minimum(1, t / (dur * .35)) * np.minimum(1, (dur - t) / (dur * .3)); return lp(x, 1400) * e * .035
def riser(dur):
    n = secs(dur); x = bp(rng.standard_normal(n), 500, 9000) * np.linspace(0, 1, n) ** 2.5; return x * .18
def crash():
    n = secs(1.6); return hp(rng.standard_normal(n), 4000) * env(n, .002, 1.1, 4) * .22

# ------------------------------------------------------------------ arrangement
BPM = 104.0; BEAT = 60 / BPM; BAR = 4 * BEAT; S16 = BEAT / 4; SWING = .028
#          Dm9                 G13                 Cmaj9               Am9
CH = [([62, 65, 69, 72, 76], 38), ([59, 62, 65, 69, 76], 43), ([60, 64, 67, 71, 74], 36), ([57, 60, 64, 67, 71], 45)]
CH2 = [([65, 69, 72, 76], 41), ([67, 71, 74, 77], 43), ([64, 67, 71, 74], 40), ([57, 60, 64, 67, 71], 45)]  # lift: Fmaj7 G7 Em7 Am9
T = lambda k: marks.get(k, 1e9)
END = T('end') if 'end' in marks else DUR
FINAL = T('outro') + 4.25 if 'outro' in marks else DUR - 5      # the closing logo card
def level(t):
    if t < T('import') - .1: return 0          # cold open: pad and pulses only
    if t < T('now'): return 1                  # light groove
    if t < T('drawer'): return 2               # full groove
    if t < T('chat'): return 1.5               # thinner: someone is typing a prompt
    if t < T('outputs'): return 3              # busiest: Codex is working
    if t < T('skill'): return 2
    if t < T('project'): return 2.5
    if t < T('week'): return 1.5
    if t < T('office'): return 2
    if t < T('outro'): return 3
    return 3.5
t0 = T('import') - 4 * BAR if 'import' in marks else 0      # bar grid is anchored so the groove lands on chapter 01
while t0 > 0: t0 -= BAR
K, Sn, Cl, Hc, Ho, Sh, Rm = kick(), snare(), clap(), hat(), hat(True), shaker(), rim()
bar = 0; t = t0; bounds = sorted(v for k, v in marks.items() if k not in ('open', 'end'))
while t < FINAL - .05:
    lv = level(t + .05); nxt = level(t + BAR + .05)
    lift = (bar // 4) % 4 == 3 and lv >= 2
    notes, root = (CH2 if lift else CH)[bar % 4]
    sw = lambda s: t + s * S16 + (SWING if s % 2 else 0)
    change = any(t < b <= t + BAR + .01 for b in bounds) or nxt != lv
    if lv == 0:
        if t >= 0:
            put(music, pad(notes, BAR * 1.15), t, 1.6)
            for s in (0, 6, 10): put(music, epiano(notes[s % 3] + 12, .5, .5), sw(s), .7, rng.uniform(-.4, .4))
            if t > 2.5: put(music, bass(root, BEAT * 1.5), t, .55)
            if nxt > 0: put(music, riser(BAR), t, 1.0); [put(music, Sn, sw(s), .25 + .08 * i) for i, s in enumerate((8, 10, 12, 13, 14, 15))]
    else:
        if bar % 8 == 0 or level(t - .1) != lv: put(music, crash(), t, .7 if lv >= 2 else .4)
        put(music, pad(notes, BAR * 1.1), t, .9)
        # drums
        for s in ((0, 7, 10) if lv >= 2 else (0, 10)): put(music, K, sw(s), .95)
        for s in (4, 12): put(music, Cl if lv >= 2 else Rm, sw(s), .8); lv >= 3 and put(music, Sn, sw(s), .4)
        for s in range(16):
            if lv >= 2 or s % 2 == 0: put(music, Hc, sw(s), (.55 if s % 4 == 2 else .3) * (1 if lv >= 2 else .7), .25)
            if lv >= 2.5: put(music, Sh, sw(s), .5 if s % 2 else .25, -.35)
        if lv >= 2: put(music, Ho, sw(14), .5, .25)
        # bass
        for s, m, dl in ((0, root, 3), (3, root, 2), (6, root + 12, 1.5), (8, root, 2), (11, root + 7, 2), (14, root + 10, 1.5)) if lv >= 2 else ((0, root, 5), (10, root, 3)):
            put(music, bass(m, dl * S16), sw(s), .8)
        # chords
        for s, dl in ((0, 2.5), (3, 1.5), (7, 3), (10, 1.2), (13, 2)) if lv >= 2 else ((0, 6), (10, 4)):
            for i, m in enumerate(notes): put(music, epiano(m, dl * S16, .8 if s else 1), sw(s) + i * .004, .8, (i - 2) * .22)
        # arpeggio and melody
        if lv >= 3 or lv == 2.5:
            arp = [notes[i % len(notes)] + 12 for i in (0, 2, 1, 3, 2, 4, 3, 1)]
            for i, m in enumerate(arp): put(music, pluck(m + (12 if lv >= 3.5 and i % 4 == 3 else 0), .2, 1.3), sw(i * 2), .75, .5 * np.sin(i * 1.3))
        if lv >= 2 and bar % 2 == 1:
            mel = [(2, notes[-1] + 12), (5, notes[-2] + 12), (8, notes[-1] + 12), (11, notes[2] + 12)]
            for s, m in mel: put(music, pluck(m, .35, .8), sw(s), .6, -.3)
        if change: put(music, riser(BAR * .5), t + BAR * .5, .8); [put(music, Sn, sw(s), .3 + .1 * i) for i, s in enumerate((12, 13, 14, 15))]
    bar += 1; t += BAR
# closing chord: lands with the logo, rings out to the end
for i, m in enumerate([48, 55, 60, 64, 67, 71, 74, 79]): put(music, epiano(m, 5.0, 1.0), FINAL + i * .035, .6, (i - 4) * .15)
put(music, bass(36, 3.5), FINAL, .6); put(music, crash(), FINAL, .8); put(music, K, FINAL, 1.0); put(music, pad([60, 64, 67, 71, 74], 6), FINAL, 1.4)

# ------------------------------------------------------------------ sound effects
PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91]
def fx_click():
    n = secs(.05); return (tone(2300, n) * env(n, .0005, .012) + hp(rng.standard_normal(n), 3000) * env(n, .0005, .006) * .5) * .5
def fx_key():
    n = secs(.045); f = rng.uniform(1500, 2100); return (tone(f, n) * env(n, .0005, .01) * .5 + bp(rng.standard_normal(n), 1800, 6000) * env(n, .0005, .012)) * .3
def fx_enter():
    n = secs(.12); return (sweep(n, 520, 240) * env(n, .001, .05) + hp(rng.standard_normal(n), 2500) * env(n, .001, .012) * .4) * .6
def fx_pop(up=True):
    n = secs(.11); return sweep(n, *((380, 980) if up else (900, 320))) * env(n, .002, .07) * .5
def fx_say():
    n = secs(.38); x = rng.standard_normal(n); f = np.geomspace(700, 4200, n); y = np.zeros(n)
    for a, b in ((0, n // 3), (n // 3, 2 * n // 3), (2 * n // 3, n)): y[a:b] = bp(x, f[a] * .7, f[b - 1] * 1.4)[a:b]
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2 * .22
def fx_whoosh():
    n = secs(1.0); x = rng.standard_normal(n); y = lp(x, 900) * np.sin(np.linspace(0, np.pi, n)) ** 3 * 1.4 + bp(x, 1500, 7000) * np.sin(np.linspace(0, np.pi, n)) ** 6 * .5
    return (y + sweep(n, 70, 38) * np.sin(np.linspace(0, np.pi, n)) ** 2 * .9) * .5
def fx_ting():
    n = secs(.9); return (tone(1568, n) + tone(2349, n) * .5 + tone(3136, n) * .25) * env(n, .002, .5, 5) * .16
def fx_card():
    n = secs(.6); return (sweep(n, 110, 40) * env(n, .001, .3) * 1.1 + lp(rng.standard_normal(n), 2500) * env(n, .001, .05) * .35) * .7
def fx_beat(k):
    m = PENTA[k % len(PENTA)]; n = secs(.5); return (tone(hz(m), n) + tone(hz(m) * 4, n) * .25) * env(n, .002, .25, 5) * .3
def fx_alert():
    n = secs(.16); a = tone(880, n) * env(n, .003, .1); return np.concatenate([a, np.zeros(secs(.04)), tone(660, n) * env(n, .003, .12)]) * .4
def fx_done():
    x = np.zeros(secs(1.6))
    for i, m in enumerate((72, 76, 79, 84)):
        n = secs(1.0); j = secs(i * .085); x[j:j + n] += (tone(hz(m), n) + tone(hz(m) * 2, n) * .35 + tone(hz(m) * 3, n) * .12) * env(n, .003, .6, 5)
    return x * .22
def fx_cam():
    n = secs(.7); return lp(rng.standard_normal(n), 500) * np.sin(np.linspace(0, np.pi, n)) ** 2 * .22
k = 0; last = {}
for name, t in events:
    pan = rng.uniform(-.25, .25)
    if name in ('cam', 'say', 'pop', 'ting') and t - last.get(name, -9) < .12: continue
    last[name] = t
    if name == 'click': put(fx, fx_click(), t, 1.0, pan)
    elif name == 'key': put(fx, fx_key(), t, rng.uniform(.7, 1), pan)
    elif name == 'enter': put(fx, fx_enter(), t, 1.0)
    elif name == 'grab': put(fx, fx_pop(True), t, .8)
    elif name == 'drop': put(fx, fx_pop(False), t, .9); put(fx, fx_enter(), t + .02, .5)
    elif name == 'say': put(fx, fx_say(), t, 1.0, -.3)
    elif name == 'pop': put(fx, fx_pop(True), t, .7, .45); put(fx, fx_ting(), t + .05, .35, .45)
    elif name == 'ting': put(fx, fx_ting(), t, .9, pan)
    elif name == 'card': put(fx, fx_card(), t, 1.0); put(fx, fx_say(), t, .8)
    elif name == 'whoosh': put(fx, fx_whoosh(), t - .08, 1.0)
    elif name == 'beat': put(fx, fx_beat(k), t, 1.0, pan); k += 1
    elif name == 'alert': put(fx, fx_alert(), t, 1.0)
    elif name == 'done': put(fx, fx_done(), t, 1.0)
    elif name == 'cam': put(fx, fx_cam(), t, 1.0, pan)

# ------------------------------------------------------------------ mix and master
music = music[:int(DUR * SR)]; fx = fx[:int(DUR * SR)]
duck = np.abs(fx).max(axis=1); w = secs(.25); duck = np.convolve(duck, np.ones(w) / w, 'same'); duck = 1 - np.clip(duck * 2.5, 0, .3)
mix = music * duck[:, None] * .8 + fx * 1.0
fade = secs(.4); mix[:fade] *= np.linspace(0, 1, fade)[:, None]; tail = secs(1.6); mix[-tail:] *= (np.linspace(1, 0, tail) ** 1.5)[:, None]
mix = np.tanh(mix * 1.5); mix = mix / np.abs(mix).max() * .89
with wave.open(out, 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out, round(len(mix) / SR, 2), 's', len(events), 'events', bar, 'bars')
