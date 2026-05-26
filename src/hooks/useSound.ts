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

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.3) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)
  osc.connect(g)
  g.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

export function playCorrect() {
  playTone(523, 0.15, 'sine', 0.3)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 100)
  setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200)
}

export function playWrong() {
  playTone(200, 0.3, 'square', 0.15)
}

export function playClick() {
  playTone(800, 0.05, 'sine', 0.1)
}

export function playLevelUp() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'sine', 0.3), i * 120))
}

export function playBadge() {
  const notes = [784, 988, 1175, 1319]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.25, 'triangle', 0.3), i * 100))
}

export function playGameStart() {
  const notes = [262, 330, 392, 523]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'sine', 0.25), i * 80))
}

export function playCountdown() {
  playTone(440, 0.1, 'sine', 0.2)
}
