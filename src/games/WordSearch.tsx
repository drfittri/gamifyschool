import { useState, useEffect, useMemo } from 'react'
import { playCorrect, playClick } from '../hooks/useSound'

interface Props { words: string[]; onCorrect: () => void; onWrong: () => void; onComplete: () => void }

export default function WordSearchGame({ words, onCorrect, onComplete }: Props) {
  const pool = words.filter(w => w.length >= 3 && w.length <= 8).slice(0, 6)
  const gridSize = Math.max(8, Math.ceil(Math.sqrt(pool.reduce((s, w) => s + w.length, 0)) * 1.8))

  const [found, setFound] = useState<Set<string>>(new Set())
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([])

  const { grid, positions, placedWords } = useMemo(() => {
    const g: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''))
    const pos: Record<string, [number, number][]> = {}
    const letters = 'abcdefghijklmnopqrstuvwxyz'

    for (const word of pool) {
      let placed = false
      for (let attempt = 0; attempt < 50 && !placed; attempt++) {
        const dir = Math.floor(Math.random() * 4)
        let sr = 0, sc = 0, dr = 0, dc = 0
        if (dir === 0) { dr = 0; dc = 1; sr = Math.floor(Math.random() * gridSize); sc = Math.floor(Math.random() * (gridSize - word.length)) }
        else if (dir === 1) { dr = 1; dc = 0; sr = Math.floor(Math.random() * (gridSize - word.length)); sc = Math.floor(Math.random() * gridSize) }
        else if (dir === 2) { dr = 1; dc = 1; sr = Math.floor(Math.random() * (gridSize - word.length)); sc = Math.floor(Math.random() * (gridSize - word.length)) }
        else { dr = 1; dc = -1; sr = Math.floor(Math.random() * (gridSize - word.length)); sc = word.length - 1 + Math.floor(Math.random() * (gridSize - word.length + 1)) }

        let ok = true
        const cells: [number, number][] = []
        for (let i = 0; i < word.length; i++) {
          const r = sr + dr * i, c = sc + dc * i
          if (g[r][c] && g[r][c] !== word[i]) { ok = false; break }
          cells.push([r, c])
        }
        if (ok) { for (let i = 0; i < word.length; i++) g[cells[i][0]][cells[i][1]] = word[i]; pos[word] = cells; placed = true }
      }
    }
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) if (!g[r][c]) g[r][c] = letters[Math.floor(Math.random() * 26)]
    // only words actually placed in the grid are findable
    return { grid: g, positions: pos, placedWords: pool.filter(w => pos[w]) }
  }, [words.join(',')])

  const handleCellClick = (r: number, c: number) => {
    playClick()
    const last = selectedCells[selectedCells.length - 1]
    if (!last) { setSelectedCells([[r, c]]); return }
    const [lr, lc] = last
    const dr = Math.abs(r - lr); const dc = Math.abs(c - lc)
    if ((dr <= 1 && dc <= 1 && (dr + dc > 0)) && (dr === 0 || dc === 0 || dr === dc)) {
      setSelectedCells([...selectedCells, [r, c]])
    } else { setSelectedCells([[r, c]]) }
  }

  useEffect(() => {
    if (selectedCells.length < 2) return
    const selectedWord = selectedCells.map(([r, c]) => grid[r][c]).join('')
    const reversedWord = [...selectedCells].reverse().map(([r, c]) => grid[r][c]).join('')

    for (const word of placedWords) {
      if (found.has(word)) continue
      if (selectedWord === word || reversedWord === word) {
        const f = new Set(found); f.add(word); setFound(f); setSelectedCells([])
        playCorrect(); onCorrect()
        if (f.size >= placedWords.length) setTimeout(onComplete, 800)
        return
      }
    }
  }, [selectedCells])

  const isSelected = (r: number, c: number) => selectedCells.some(([sr, sc]) => sr === r && sc === c)
  const isFound = (r: number, c: number) => { for (const word of found) { if (positions[word]?.some(([wr, wc]) => wr === r && wc === c)) return true }; return false }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="clay-card px-5 py-2 text-center border-3 border-teal-200 bg-teal-50 w-full max-w-sm">
        <div className="text-2xl mb-0.5">🔭🌿🎯</div>
        <p className="text-base font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>
          Recon mission! Enemy words are hiding in the jungle grid!
        </p>
        <p className="text-sm text-clay-text-muted font-semibold">Tap letters in order to locate the target words!</p>
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center max-w-[380px]">
        {placedWords.map(w => (
          <span key={w} className={`px-2.5 py-1 rounded-lg text-base font-extrabold transition-all ${found.has(w) ? 'bg-clay-success/20 text-clay-success line-through' : 'bg-clay-surface text-clay-text'}`}
            style={{ fontFamily: 'var(--font-display)' }}>{w}</span>
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg flex items-center justify-center text-base font-extrabold transition-all border-2 ${
              isFound(r, c) ? 'bg-clay-success/20 text-clay-success border-clay-success/30' : isSelected(r, c) ? 'clay-card border-clay-primary/30' : 'bg-white/80 text-clay-text border-white/60 hover:bg-clay-surface'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}>
            {cell.toUpperCase()}
          </button>
        )))}
      </div>
      <div className="text-clay-text-muted text-sm font-semibold">🎯 Targets located: {found.size}/{placedWords.length}</div>
    </div>
  )
}
