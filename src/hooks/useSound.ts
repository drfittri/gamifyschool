// Web Audio synth SFX kit + browser TTS. No audio files.
// All effects route through one master gain so the mute toggle
// silences everything; the mute flag persists in localStorage.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
const SpeechUtterance = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null

export function speak(text: string) {
  if (!synth || !SpeechUtterance) return
  synth.cancel()
  const utter = new SpeechUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.8
  utter.pitch = 1.1
  synth.speak(utter)
}

// ---------------------------------------------------------------- audio core

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
const MUTE_KEY = 'gamifyschool_muted'

function ensureAudio(): { ctx: AudioContext; out: GainNode } | null {
  if (!audioCtx) return null
  if (!master) {
    master = audioCtx.createGain()
    master.gain.value = localStorage.getItem(MUTE_KEY) === '1' ? 0 : 1
    master.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return { ctx: audioCtx, out: master }
}

// Browsers suspend AudioContext until a user gesture; nudge it awake.
if (typeof window !== 'undefined') {
  const wake = () => { ensureAudio() }
  window.addEventListener('pointerdown', wake, { once: true })
  window.addEventListener('keydown', wake, { once: true })
}

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === '1'
}

export function setMuted(m: boolean) {
  localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  if (master && audioCtx) {
    master.gain.setTargetAtTime(m ? 0 : 1, audioCtx.currentTime, 0.02)
  }
  listeners.forEach(fn => fn(m))
}

const listeners = new Set<(m: boolean) => void>()
export function onMuteChange(fn: (m: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3, at = 0, slideTo?: number) {
  const a = ensureAudio()
  if (!a) return
  const t0 = a.ctx.currentTime + at
  const osc = a.ctx.createOscillator()
  const g = a.ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.connect(g)
  g.connect(a.out)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

function playNoise(duration: number, gain: number, opts: { from?: number; to?: number; type?: BiquadFilterType; at?: number } = {}) {
  const a = ensureAudio()
  if (!a) return
  const t0 = a.ctx.currentTime + (opts.at ?? 0)
  const src = a.ctx.createBufferSource()
  src.buffer = getNoise(a.ctx)
  src.loop = true
  const filt = a.ctx.createBiquadFilter()
  filt.type = opts.type ?? 'lowpass'
  filt.frequency.setValueAtTime(opts.from ?? 900, t0)
  filt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.to ?? 120), t0 + duration)
  const g = a.ctx.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  src.connect(filt)
  filt.connect(g)
  g.connect(a.out)
  src.start(t0)
  src.stop(t0 + duration + 0.05)
}

// ---------------------------------------------------------------- gameplay SFX

export function playCorrect() {
  playTone(523, 0.15, 'sine', 0.3)
  playTone(659, 0.15, 'sine', 0.3, 0.1)
  playTone(784, 0.2, 'sine', 0.3, 0.2)
}

export function playWrong() {
  playTone(200, 0.28, 'square', 0.12)
  playTone(150, 0.32, 'square', 0.1, 0.12)
}

export function playClick() {
  playTone(800, 0.05, 'sine', 0.1)
}

export function playLevelUp() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => playTone(n, 0.2, 'sine', 0.3, i * 0.12))
}

export function playBadge() {
  const notes = [784, 988, 1175, 1319]
  notes.forEach((n, i) => playTone(n, 0.25, 'triangle', 0.3, i * 0.1))
}

export function playGameStart() {
  const notes = [262, 330, 392, 523]
  notes.forEach((n, i) => playTone(n, 0.15, 'sine', 0.25, i * 0.08))
}

export function playCountdown() {
  playTone(440, 0.1, 'sine', 0.2)
}

/** Zap for shots/lasers. */
export function playLaser() {
  playTone(880, 0.12, 'sawtooth', 0.12, 0, 160)
  playTone(1400, 0.06, 'sine', 0.06, 0, 400)
}

/** Explosion; size 0..1 scales length and depth. */
export function playExplosion(size = 0.5) {
  const d = 0.35 + size * 0.5
  playNoise(d, 0.28 + size * 0.15, { from: 1400 - size * 700, to: 90 })
  playTone(120 - size * 40, d * 0.8, 'sine', 0.22, 0, 40)
}

/** Rising pickup arpeggio (power-ups, fuel cells). */
export function playPowerup() {
  playTone(392, 0.09, 'triangle', 0.22)
  playTone(523, 0.09, 'triangle', 0.22, 0.07)
  playTone(659, 0.09, 'triangle', 0.22, 0.14)
  playTone(880, 0.16, 'triangle', 0.22, 0.21)
}

/** Combo streak blip; pitch climbs with the streak. */
export function playComboStreak(streak: number) {
  const base = 620 * Math.pow(1.06, Math.min(10, streak))
  playTone(base, 0.09, 'square', 0.1)
  playTone(base * 1.5, 0.14, 'square', 0.1, 0.08)
}

/** Big victory fanfare for mission complete. */
export function playFanfare() {
  const seq: [number, number][] = [[523, 0], [523, 0.12], [523, 0.24], [659, 0.4], [784, 0.56], [1047, 0.76]]
  for (const [f, at] of seq) playTone(f, 0.22, 'triangle', 0.26, at)
  playTone(523, 0.9, 'sine', 0.14, 0.76)
  playTone(659, 0.9, 'sine', 0.12, 0.76)
  playTone(784, 0.9, 'sine', 0.12, 0.76)
}

/** Short mission-start sting (war-drums vibe). */
export function playMissionSting() {
  playTone(196, 0.18, 'sawtooth', 0.14)
  playTone(196, 0.18, 'sawtooth', 0.14, 0.16)
  playTone(262, 0.3, 'sawtooth', 0.16, 0.32)
  playNoise(0.25, 0.12, { from: 300, to: 60, at: 0.32 })
}

/** Two-tone alarm (boss incoming, low shields). */
export function playWarn() {
  playTone(660, 0.14, 'square', 0.1)
  playTone(520, 0.14, 'square', 0.1, 0.16)
  playTone(660, 0.14, 'square', 0.1, 0.32)
}

/** Rocket/engine rumble; returns a stop() that fades the noise out. */
export function playRumble(): () => void {
  const a = ensureAudio()
  if (!a) return () => {}
  const src = a.ctx.createBufferSource()
  src.buffer = getNoise(a.ctx)
  src.loop = true
  const filt = a.ctx.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.value = 160
  const g = a.ctx.createGain()
  g.gain.setValueAtTime(0.0001, a.ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.3, a.ctx.currentTime + 0.3)
  // slow wobble so it feels alive
  const lfo = a.ctx.createOscillator()
  const lfoGain = a.ctx.createGain()
  lfo.frequency.value = 9
  lfoGain.gain.value = 0.08
  lfo.connect(lfoGain)
  lfoGain.connect(g.gain)
  src.connect(filt)
  filt.connect(g)
  g.connect(a.out)
  src.start()
  lfo.start()
  let stopped = false
  return () => {
    if (stopped || !audioCtx) return
    stopped = true
    g.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.15)
    setTimeout(() => { try { src.stop(); lfo.stop() } catch { /* already stopped */ } }, 600)
  }
}
