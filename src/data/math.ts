// Mathematics Year 1 — content distilled from MATEMATIK JILID 1 & 2, MAT_AKTIVITI JILID 1 & 2
// Source: NotebookLM notebook c70c41ca-f133-46ef-8c32-069cda21c7f8

export interface MathUnit {
  unit: number
  title: string          // English
  titleMy: string        // Original Malay
  emoji: string
  theme: MathTheme       // visual theme for games
  concepts: string[]
  games: string[]        // game ids enabled for this unit
}

export type MathTheme =
  | 'army'        // soldiers / tanks
  | 'jet'         // fighter jets
  | 'rocket'      // space / rockets
  | 'race'        // race cars
  | 'animal'      // jungle adventure
  | 'pirate'      // treasure
  | 'knight'      // medieval
  | 'farm'        // farm

export const MATH_UNITS: MathUnit[] = [
  {
    unit: 1, title: 'Numbers to 100', titleMy: 'Nombor Hingga 100', emoji: '🔢', theme: 'army',
    concepts: ['count 0-100', 'place value', 'more or less', 'order', 'patterns', 'rounding'],
    games: ['mcount', 'mrocket', 'mshooter'],
  },
  {
    unit: 2, title: 'Add & Subtract', titleMy: 'Tambah dan Tolak', emoji: '➕', theme: 'jet',
    concepts: ['addition to 100', 'subtraction to 100', 'word problems', 'repeated addition'],
    games: ['mshooter', 'mrace', 'mrocket'],
  },
  {
    unit: 3, title: 'Fractions', titleMy: 'Pecahan', emoji: '🍕', theme: 'pirate',
    concepts: ['half', 'quarter', 'identify shaded parts'],
    games: ['mfraction', 'mshooter', 'mrace'],
  },
  {
    unit: 4, title: 'Money', titleMy: 'Wang', emoji: '💰', theme: 'pirate',
    concepts: ['ringgit & sen', 'coin values', 'add money', 'change'],
    games: ['mcoin', 'mshooter', 'mcount'],
  },
  {
    unit: 5, title: 'Time', titleMy: 'Masa dan Waktu', emoji: '⏰', theme: 'knight',
    concepts: ['read clock to hour', 'half past', 'days of week', 'months'],
    games: ['mclock', 'mrace', 'mshooter'],
  },
  {
    unit: 6, title: 'Length, Mass, Volume', titleMy: 'Panjang, Jisim, Isi Padu', emoji: '⚖️', theme: 'farm',
    concepts: ['compare length', 'mass on scale', 'liquid volume'],
    games: ['mbalance', 'mrace', 'mshooter'],
  },
  {
    unit: 7, title: 'Shapes', titleMy: 'Bentuk', emoji: '🔷', theme: 'rocket',
    concepts: ['2D shapes', '3D shapes', 'patterns'],
    games: ['mshape', 'mshooter', 'mrocket'],
  },
  {
    unit: 8, title: 'Data', titleMy: 'Data', emoji: '📊', theme: 'animal',
    concepts: ['pictograph', 'count and compare'],
    games: ['mcount', 'mshooter', 'mrace'],
  },
]

// ---------- Question generators per unit ----------

export interface MathQuestion {
  prompt: string        // text shown
  display?: string      // optional visual (emoji or special)
  options: string[]     // multiple choice strings
  answer: string        // correct option (must be in options)
  hint?: string
}

const rand = (n: number) => Math.floor(Math.random() * n)
const pick = <T,>(arr: T[]) => arr[rand(arr.length)]
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length-1; i>0; i--){ const j = rand(i+1); [b[i],b[j]]=[b[j],b[i]] } return b }
const uniq = <T,>(a: T[]) => Array.from(new Set(a))

function withDistractors(answer: number, range: [number,number], count = 3): string[] {
  const opts = new Set<number>([answer])
  let safety = 0
  while (opts.size < count + 1 && safety++ < 50) {
    const delta = 1 + rand(Math.max(2, Math.floor((range[1]-range[0])/8)))
    const sign = Math.random() < 0.5 ? -1 : 1
    const cand = answer + sign * delta
    if (cand >= range[0] && cand <= range[1] && cand !== answer) opts.add(cand)
  }
  while (opts.size < count + 1) opts.add(answer + opts.size)
  return shuffle(Array.from(opts).map(String))
}

// Unit 1 — Numbers to 100
export function genUnit1(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const r = rand(5)
    if (r === 0) {
      // count emoji
      const count = 1 + rand(20)
      const emo = pick(['⭐','🍎','🎈','🦋','🐝','🚗','🪖'])
      out.push({ prompt: 'Count them!', display: emo.repeat(count), options: withDistractors(count, [1, 25]), answer: String(count) })
    } else if (r === 1) {
      // more / less
      const a = 5 + rand(90), b = 5 + rand(90)
      if (a === b) { i--; continue }
      const more = Math.random() < 0.5
      out.push({
        prompt: more ? `Which is MORE?` : `Which is LESS?`,
        options: shuffle([String(a), String(b)]),
        answer: String(more ? Math.max(a,b) : Math.min(a,b)),
      })
    } else if (r === 2) {
      // place value
      const n2 = 11 + rand(89)
      const tens = Math.floor(n2/10), ones = n2 % 10
      const askTens = Math.random() < 0.5
      out.push({
        prompt: `In ${n2}, what is the ${askTens ? 'TENS' : 'ONES'} digit?`,
        options: withDistractors(askTens ? tens : ones, [0, 9]),
        answer: String(askTens ? tens : ones),
      })
    } else if (r === 3) {
      // pattern (counting by 1,2,5,10)
      const step = pick([1, 2, 5, 10])
      const start = 1 + rand(50)
      const seq = [start, start+step, start+2*step]
      const ans = start + 3*step
      out.push({
        prompt: `What comes next?  ${seq.join(', ')}, ___`,
        options: withDistractors(ans, [0, 100]),
        answer: String(ans),
      })
    } else {
      // round to nearest 10
      const n2 = 11 + rand(88)
      const ans = Math.round(n2/10)*10
      out.push({
        prompt: `Round ${n2} to nearest 10`,
        options: withDistractors(ans, [0, 100]).map(s => s),
        answer: String(ans),
      })
    }
  }
  return out
}

// Unit 2 — Add & Subtract
export function genUnit2(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const add = Math.random() < 0.6
    if (add) {
      const a = 1 + rand(50), b = 1 + rand(50)
      const ans = a + b
      out.push({ prompt: `${a} + ${b} = ?`, options: withDistractors(ans, [0, 110]), answer: String(ans) })
    } else {
      const a = 10 + rand(89), b = 1 + rand(a-1)
      const ans = a - b
      out.push({ prompt: `${a} − ${b} = ?`, options: withDistractors(ans, [0, 100]), answer: String(ans) })
    }
  }
  return out
}

// Unit 3 — Fractions
export interface FractionQ { num: number; den: number }
export function genUnit3(n = 6): MathQuestion[] {
  const out: MathQuestion[] = []
  const fracs: [number,number][] = [[1,2],[1,4],[2,4],[3,4],[1,3],[2,3]]
  for (let i = 0; i < n; i++) {
    const [num, den] = pick(fracs)
    const distract: string[] = []
    while (distract.length < 3) {
      const [n2,d2] = pick(fracs)
      const s = `${n2}/${d2}`
      if (s !== `${num}/${den}` && !distract.includes(s)) distract.push(s)
    }
    out.push({
      prompt: 'What fraction is shaded?',
      display: `${num}/${den}`,
      options: shuffle([`${num}/${den}`, ...distract]),
      answer: `${num}/${den}`,
    })
  }
  return out
}

// Unit 4 — Money (RM)
export function genUnit4(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  const coins = [5, 10, 20, 50] // sen
  const notes = [1, 5, 10] // ringgit
  for (let i = 0; i < n; i++) {
    const r = rand(3)
    if (r === 0) {
      // sum coins
      const c1 = pick(coins), c2 = pick(coins)
      const ans = c1 + c2
      out.push({
        prompt: `${c1}¢ + ${c2}¢ = ?`,
        options: withDistractors(ans, [5, 200]).map(s => `${s}¢`),
        answer: `${ans}¢`,
      })
    } else if (r === 1) {
      // value: how many sen in RMx
      const rm = pick(notes)
      const ans = rm * 100
      out.push({
        prompt: `RM${rm} = ? sen`,
        options: withDistractors(ans, [50, 1500]).map(s => s),
        answer: String(ans),
      })
    } else {
      // change
      const paid = pick(notes)
      const cost = 10 + rand((paid*100) - 20)
      const ans = paid*100 - cost
      out.push({
        prompt: `Cost ${cost}¢. Paid RM${paid}. Change = ?`,
        options: withDistractors(ans, [5, paid*100]).map(s => `${s}¢`),
        answer: `${ans}¢`,
      })
    }
  }
  return out
}

// Unit 5 — Time
export interface ClockQ { hour: number; minute: number }
export function genUnit5(n = 6): MathQuestion[] {
  const out: MathQuestion[] = []
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  for (let i = 0; i < n; i++) {
    const r = rand(3)
    if (r === 0) {
      const h = 1 + rand(12)
      const half = Math.random() < 0.5
      const m = half ? 30 : 0
      const ans = `${h}:${m.toString().padStart(2,'0')}`
      const others = uniq([1+rand(12), 1+rand(12), 1+rand(12)]).filter(x => x !== h).slice(0,3)
        .map(x => `${x}:${(Math.random()<0.5?0:30).toString().padStart(2,'0')}`)
      while (others.length < 3) others.push(`${1+rand(12)}:00`)
      out.push({ prompt: 'What time is shown?', display: ans, options: shuffle([ans, ...others.slice(0,3)]), answer: ans })
    } else if (r === 1) {
      const idx = rand(7)
      const ans = days[idx]
      const others = shuffle(days.filter(d => d !== ans)).slice(0,3)
      out.push({ prompt: `What day comes AFTER ${days[(idx+6)%7]}?`, options: shuffle([ans, ...others]), answer: ans })
    } else {
      const idx = rand(11)
      const ans = months[idx+1]
      const others = shuffle(months.filter(m => m !== ans)).slice(0,3)
      out.push({ prompt: `What month comes AFTER ${months[idx]}?`, options: shuffle([ans, ...others]), answer: ans })
    }
  }
  return out
}

// Unit 6 — Length / Mass / Volume
export function genUnit6(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const r = rand(3)
    if (r === 0) {
      // longer/shorter
      const a = 1 + rand(20), b = 1 + rand(20)
      if (a === b) { i--; continue }
      const longer = Math.random() < 0.5
      out.push({
        prompt: longer ? 'Which is LONGER?' : 'Which is SHORTER?',
        display: `${a}|${b}`,
        options: shuffle([`${a} cm`, `${b} cm`]),
        answer: longer ? `${Math.max(a,b)} cm` : `${Math.min(a,b)} cm`,
      })
    } else if (r === 1) {
      const a = 1 + rand(20), b = 1 + rand(20)
      if (a === b) { i--; continue }
      const heavier = Math.random() < 0.5
      out.push({
        prompt: heavier ? 'Which is HEAVIER?' : 'Which is LIGHTER?',
        display: `${a}vs${b}`,
        options: shuffle([`${a} kg`, `${b} kg`]),
        answer: heavier ? `${Math.max(a,b)} kg` : `${Math.min(a,b)} kg`,
      })
    } else {
      const a = 1 + rand(10), b = 1 + rand(10)
      if (a === b) { i--; continue }
      const more = Math.random() < 0.5
      out.push({
        prompt: more ? 'Which holds MORE water?' : 'Which holds LESS water?',
        display: `${a}~${b}`,
        options: shuffle([`${a} L`, `${b} L`]),
        answer: more ? `${Math.max(a,b)} L` : `${Math.min(a,b)} L`,
      })
    }
  }
  return out
}

// Unit 7 — Shapes
export const SHAPES_2D = ['circle','square','triangle','rectangle','star','heart']
export const SHAPES_3D = ['cube','sphere','cone','cylinder','pyramid']
export function genUnit7(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const is3d = Math.random() < 0.5
    const pool = is3d ? SHAPES_3D : SHAPES_2D
    const ans = pick(pool)
    const others = shuffle(pool.filter(s => s !== ans)).slice(0,3)
    out.push({
      prompt: 'What shape is this?',
      display: ans,
      options: shuffle([ans, ...others]),
      answer: ans,
    })
  }
  return out
}

// Unit 8 — Data (pictograph)
export function genUnit8(n = 6): MathQuestion[] {
  const out: MathQuestion[] = []
  const animals = ['🐶','🐱','🐰','🐸','🐯','🐵']
  for (let i = 0; i < n; i++) {
    const counts = animals.slice(0,3).map(() => 1 + rand(8))
    const r = rand(3)
    const display = animals.slice(0,3).map((a, j) => `${a}${' '+a.repeat(counts[j]-1)}`).join('|')
    if (r === 0) {
      // most
      const idx = counts.indexOf(Math.max(...counts))
      out.push({
        prompt: 'Which has the MOST?',
        display,
        options: shuffle(animals.slice(0,3)),
        answer: animals[idx],
      })
    } else if (r === 1) {
      const idx = counts.indexOf(Math.min(...counts))
      out.push({
        prompt: 'Which has the LEAST?',
        display,
        options: shuffle(animals.slice(0,3)),
        answer: animals[idx],
      })
    } else {
      const idx = rand(3)
      out.push({
        prompt: `How many ${animals[idx]} ?`,
        display,
        options: withDistractors(counts[idx], [1, 10]),
        answer: String(counts[idx]),
      })
    }
  }
  return out
}

export function generateQuestions(unitIdx: number, n = 8): MathQuestion[] {
  switch (unitIdx) {
    case 0: return genUnit1(n)
    case 1: return genUnit2(n)
    case 2: return genUnit3(n)
    case 3: return genUnit4(n)
    case 4: return genUnit5(n)
    case 5: return genUnit6(n)
    case 6: return genUnit7(n)
    case 7: return genUnit8(n)
    default: return genUnit1(n)
  }
}

// ---------- Game definitions ----------

export interface MathGameDef {
  id: string
  title: string
  emoji: string
  description: string
  themeNote: string  // dynamic theme adapts per unit
}

export const MATH_GAMES: MathGameDef[] = [
  { id: 'mshooter',  title: 'Sniper Strike',   emoji: '🎯', description: 'Shoot the right answer!',     themeNote: 'army/jet target shooter' },
  { id: 'mrocket',   title: 'Rocket Launch',   emoji: '🚀', description: 'Fuel the rocket — answer fast!', themeNote: 'space rocket' },
  { id: 'mrace',     title: 'Speed Race',      emoji: '🏎️', description: 'Race to the finish line!',    themeNote: 'race car' },
  { id: 'mcount',    title: 'Troop Count',     emoji: '🪖', description: 'Count the soldiers / coins / animals!', themeNote: 'counting' },
  { id: 'mfraction', title: 'Pizza Slicer',    emoji: '🍕', description: 'Match the fraction slice!',   themeNote: 'fraction pie' },
  { id: 'mcoin',     title: 'Coin Quest',      emoji: '🪙', description: 'Pay & collect RM coins!',     themeNote: 'money RM' },
  { id: 'mclock',    title: 'Clock Tower',     emoji: '🕰️', description: 'Defend the clock tower!',     themeNote: 'time' },
  { id: 'mbalance',  title: 'Balance Scale',   emoji: '⚖️', description: 'Tip the scale right!',        themeNote: 'compare' },
  { id: 'mshape',    title: 'Shape Squadron',  emoji: '🔷', description: 'Identify the shape!',         themeNote: 'shapes' },
]

export function gamesForUnit(unitIdx: number): MathGameDef[] {
  const ids = MATH_UNITS[unitIdx]?.games || []
  return ids.map(id => MATH_GAMES.find(g => g.id === id)!).filter(Boolean)
}
