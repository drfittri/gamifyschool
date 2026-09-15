// Dev-only QA hook. The Playwright harness reads `window.__qa` to know
// the current round (target word, options, and — for canvas games — the
// live position of the correct target in CSS px inside the canvas) so it
// can play like a child: real pointer events on the same hit areas.
// Stripped from production builds by the import.meta.env.DEV guard.
export interface QaState {
  game: string
  phase: 'briefing' | 'playing' | 'boss' | 'move' | 'done'
  word?: string
  options?: string[]
  point?: { x: number; y: number }
  bestMove?: 'up' | 'down' | 'left' | 'right'
}

export function qaExpose(state: QaState | null) {
  if (import.meta.env.DEV) {
    ;(window as unknown as { __qa?: QaState }).__qa = state ?? undefined
  }
}
