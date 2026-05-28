// Matematik Tahun 1 — kandungan dari MATEMATIK JILID 1 & 2, MAT_AKTIVITI JILID 1 & 2
// Sumber: NotebookLM notebook c70c41ca-f133-46ef-8c32-069cda21c7f8

export interface MathUnit {
  unit: number
  title: string          // Malay (utama)
  titleEn: string        // English ref
  emoji: string
  theme: MathTheme
  concepts: string[]
  games: string[]
}

export type MathTheme =
  | 'army' | 'jet' | 'rocket' | 'race' | 'animal' | 'pirate' | 'knight' | 'farm'

export const MATH_UNITS: MathUnit[] = [
  {
    unit: 1, title: 'Nombor Hingga 100', titleEn: 'Numbers to 100', emoji: '🔢', theme: 'army',
    concepts: ['kira 0–100', 'nilai tempat', 'lebih atau kurang', 'susunan nombor', 'pola nombor', 'bundar'],
    games: ['mcount', 'mrocket', 'mshooter'],
  },
  {
    unit: 2, title: 'Tambah dan Tolak', titleEn: 'Add & Subtract', emoji: '➕', theme: 'jet',
    concepts: ['tambah hingga 100', 'tolak hingga 100', 'cerita matematik', 'tambah berulang'],
    games: ['mshooter', 'mrace', 'mrocket'],
  },
  {
    unit: 3, title: 'Pecahan', titleEn: 'Fractions', emoji: '🍕', theme: 'pirate',
    concepts: ['separuh', 'suku', 'kenal bahagian berlorek'],
    games: ['mfraction', 'mshooter', 'mrace'],
  },
  {
    unit: 4, title: 'Wang', titleEn: 'Money', emoji: '💰', theme: 'pirate',
    concepts: ['ringgit & sen', 'nilai duit syiling', 'tambah wang', 'baki'],
    games: ['mcoin', 'mshooter', 'mcount'],
  },
  {
    unit: 5, title: 'Masa dan Waktu', titleEn: 'Time', emoji: '⏰', theme: 'knight',
    concepts: ['baca jam', 'setengah jam', 'hari dalam minggu', 'bulan dalam tahun'],
    games: ['mclock', 'mrace', 'mshooter'],
  },
  {
    unit: 6, title: 'Panjang, Jisim, Isi Padu', titleEn: 'Length, Mass, Volume', emoji: '⚖️', theme: 'farm',
    concepts: ['banding panjang', 'jisim objek', 'isi padu cecair'],
    games: ['mbalance', 'mrace', 'mshooter'],
  },
  {
    unit: 7, title: 'Bentuk', titleEn: 'Shapes', emoji: '🔷', theme: 'rocket',
    concepts: ['bentuk 2D', 'bentuk 3D', 'pola bentuk'],
    games: ['mshape', 'mshooter', 'mrocket'],
  },
  {
    unit: 8, title: 'Data', titleEn: 'Data', emoji: '📊', theme: 'animal',
    concepts: ['piktograf', 'kira dan banding'],
    games: ['mcount', 'mshooter', 'mrace'],
  },
]

// ---------- Penjana soalan ----------

export interface MathQuestion {
  prompt: string
  display?: string
  options: string[]
  answer: string
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

// Unit 1 — Nombor Hingga 100
export function genUnit1(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const r = rand(5)
    if (r === 0) {
      const count = 1 + rand(20)
      const emo = pick(['⭐','🍎','🎈','🦋','🐝','🚗','🪖'])
      out.push({ prompt: 'Kira berapa banyak!', display: emo.repeat(count), options: withDistractors(count, [1, 25]), answer: String(count) })
    } else if (r === 1) {
      const a = 5 + rand(90), b = 5 + rand(90)
      if (a === b) { i--; continue }
      const more = Math.random() < 0.5
      out.push({
        prompt: more ? 'Yang mana LEBIH?' : 'Yang mana KURANG?',
        options: shuffle([String(a), String(b)]),
        answer: String(more ? Math.max(a,b) : Math.min(a,b)),
      })
    } else if (r === 2) {
      const n2 = 11 + rand(89)
      const tens = Math.floor(n2/10), ones = n2 % 10
      const askTens = Math.random() < 0.5
      out.push({
        prompt: `Dalam ${n2}, apakah digit ${askTens ? 'PULUH' : 'SA'}?`,
        options: withDistractors(askTens ? tens : ones, [0, 9]),
        answer: String(askTens ? tens : ones),
      })
    } else if (r === 3) {
      const step = pick([1, 2, 5, 10])
      const start = 1 + rand(50)
      const seq = [start, start+step, start+2*step]
      const ans = start + 3*step
      out.push({
        prompt: `Apakah nombor seterusnya?  ${seq.join(', ')}, ___`,
        options: withDistractors(ans, [0, 100]),
        answer: String(ans),
      })
    } else {
      const n2 = 11 + rand(88)
      const ans = Math.round(n2/10)*10
      out.push({
        prompt: `Bundarkan ${n2} kepada puluh terdekat`,
        options: withDistractors(ans, [0, 100]),
        answer: String(ans),
      })
    }
  }
  return out
}

// Unit 2 — Tambah & Tolak
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

// Unit 3 — Pecahan
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
      prompt: 'Pecahan manakah berlorek?',
      display: `${num}/${den}`,
      options: shuffle([`${num}/${den}`, ...distract]),
      answer: `${num}/${den}`,
    })
  }
  return out
}

// Unit 4 — Wang (RM)
export function genUnit4(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  const coins = [5, 10, 20, 50]
  const notes = [1, 5, 10]
  for (let i = 0; i < n; i++) {
    const r = rand(3)
    if (r === 0) {
      const c1 = pick(coins), c2 = pick(coins)
      const ans = c1 + c2
      out.push({
        prompt: `${c1} sen + ${c2} sen = ?`,
        options: withDistractors(ans, [5, 200]).map(s => `${s} sen`),
        answer: `${ans} sen`,
      })
    } else if (r === 1) {
      const rm = pick(notes)
      const ans = rm * 100
      out.push({
        prompt: `RM${rm} = ? sen`,
        options: withDistractors(ans, [50, 1500]),
        answer: String(ans),
      })
    } else {
      const paid = pick(notes)
      const cost = 10 + rand((paid*100) - 20)
      const ans = paid*100 - cost
      out.push({
        prompt: `Harga ${cost} sen. Bayar RM${paid}. Baki = ?`,
        options: withDistractors(ans, [5, paid*100]).map(s => `${s} sen`),
        answer: `${ans} sen`,
      })
    }
  }
  return out
}

// Unit 5 — Masa
export function genUnit5(n = 6): MathQuestion[] {
  const out: MathQuestion[] = []
  const days = ['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad']
  const months = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember']
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
      out.push({ prompt: 'Apakah waktu ditunjukkan?', display: ans, options: shuffle([ans, ...others.slice(0,3)]), answer: ans })
    } else if (r === 1) {
      const idx = rand(7)
      const ans = days[idx]
      const others = shuffle(days.filter(d => d !== ans)).slice(0,3)
      out.push({ prompt: `Hari apakah SELEPAS ${days[(idx+6)%7]}?`, options: shuffle([ans, ...others]), answer: ans })
    } else {
      const idx = rand(11)
      const ans = months[idx+1]
      const others = shuffle(months.filter(m => m !== ans)).slice(0,3)
      out.push({ prompt: `Bulan apakah SELEPAS ${months[idx]}?`, options: shuffle([ans, ...others]), answer: ans })
    }
  }
  return out
}

// Unit 6 — Panjang, Jisim, Isi Padu
export function genUnit6(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const r = rand(3)
    if (r === 0) {
      const a = 1 + rand(20), b = 1 + rand(20)
      if (a === b) { i--; continue }
      const longer = Math.random() < 0.5
      out.push({
        prompt: longer ? 'Yang mana LEBIH PANJANG?' : 'Yang mana LEBIH PENDEK?',
        display: `${a}|${b}`,
        options: shuffle([`${a} cm`, `${b} cm`]),
        answer: longer ? `${Math.max(a,b)} cm` : `${Math.min(a,b)} cm`,
      })
    } else if (r === 1) {
      const a = 1 + rand(20), b = 1 + rand(20)
      if (a === b) { i--; continue }
      const heavier = Math.random() < 0.5
      out.push({
        prompt: heavier ? 'Yang mana LEBIH BERAT?' : 'Yang mana LEBIH RINGAN?',
        display: `${a}vs${b}`,
        options: shuffle([`${a} kg`, `${b} kg`]),
        answer: heavier ? `${Math.max(a,b)} kg` : `${Math.min(a,b)} kg`,
      })
    } else {
      const a = 1 + rand(10), b = 1 + rand(10)
      if (a === b) { i--; continue }
      const more = Math.random() < 0.5
      out.push({
        prompt: more ? 'Yang mana ISI PADU LEBIH?' : 'Yang mana ISI PADU KURANG?',
        display: `${a}~${b}`,
        options: shuffle([`${a} L`, `${b} L`]),
        answer: more ? `${Math.max(a,b)} L` : `${Math.min(a,b)} L`,
      })
    }
  }
  return out
}

// Unit 7 — Bentuk
export const SHAPE_NAMES_MY: Record<string, string> = {
  circle: 'bulatan', square: 'segi empat sama', triangle: 'segi tiga', rectangle: 'segi empat tepat', star: 'bintang', heart: 'hati',
  cube: 'kubus', sphere: 'sfera', cone: 'kon', cylinder: 'silinder', pyramid: 'piramid',
}
export const SHAPES_2D = ['circle','square','triangle','rectangle','star','heart']
export const SHAPES_3D = ['cube','sphere','cone','cylinder','pyramid']
export function genUnit7(n = 8): MathQuestion[] {
  const out: MathQuestion[] = []
  for (let i = 0; i < n; i++) {
    const is3d = Math.random() < 0.5
    const pool = is3d ? SHAPES_3D : SHAPES_2D
    const ans = pick(pool)
    const others = shuffle(pool.filter(s => s !== ans)).slice(0,3)
    const opts = shuffle([ans, ...others]).map(s => SHAPE_NAMES_MY[s] || s)
    out.push({
      prompt: 'Apakah bentuk ini?',
      display: ans,
      options: opts,
      answer: SHAPE_NAMES_MY[ans] || ans,
    })
  }
  return out
}

// Unit 8 — Data
export function genUnit8(n = 6): MathQuestion[] {
  const out: MathQuestion[] = []
  const animals = ['🐶','🐱','🐰','🐸','🐯','🐵']
  for (let i = 0; i < n; i++) {
    const counts = animals.slice(0,3).map(() => 1 + rand(8))
    const r = rand(3)
    const display = animals.slice(0,3).map((a, j) => `${a}${' '+a.repeat(counts[j]-1)}`).join('|')
    if (r === 0) {
      const idx = counts.indexOf(Math.max(...counts))
      out.push({
        prompt: 'Yang mana PALING BANYAK?',
        display,
        options: shuffle(animals.slice(0,3)),
        answer: animals[idx],
      })
    } else if (r === 1) {
      const idx = counts.indexOf(Math.min(...counts))
      out.push({
        prompt: 'Yang mana PALING SEDIKIT?',
        display,
        options: shuffle(animals.slice(0,3)),
        answer: animals[idx],
      })
    } else {
      const idx = rand(3)
      out.push({
        prompt: `Berapa banyak ${animals[idx]}?`,
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

// ---------- Definisi permainan ----------

export interface MathGameDef {
  id: string
  title: string
  emoji: string
  description: string
  themeNote: string
}

export const MATH_GAMES: MathGameDef[] = [
  { id: 'mshooter',  title: 'Tembak Sasaran', emoji: '🎯', description: 'Tembak jawapan yang betul!',           themeNote: 'penembak askar/jet' },
  { id: 'mrocket',   title: 'Lancar Roket',   emoji: '🚀', description: 'Isi bahan api — jawab pantas!',         themeNote: 'roket angkasa' },
  { id: 'mrace',     title: 'Lumba Pantas',   emoji: '🏎️', description: 'Berlumba ke garisan penamat!',          themeNote: 'lumba kereta' },
  { id: 'mcount',    title: 'Kira Pasukan',   emoji: '🪖', description: 'Kira askar / duit / haiwan!',           themeNote: 'mengira' },
  { id: 'mfraction', title: 'Potong Piza',    emoji: '🍕', description: 'Padankan pecahan piza!',                themeNote: 'pecahan' },
  { id: 'mcoin',     title: 'Cari Duit',      emoji: '🪙', description: 'Bayar & kumpul duit RM!',               themeNote: 'wang RM' },
  { id: 'mclock',    title: 'Menara Jam',     emoji: '🕰️', description: 'Pertahankan menara jam!',               themeNote: 'masa' },
  { id: 'mbalance',  title: 'Penimbang',      emoji: '⚖️', description: 'Bandingkan dengan betul!',              themeNote: 'banding' },
  { id: 'mshape',    title: 'Skuad Bentuk',   emoji: '🔷', description: 'Kenal pasti bentuk!',                   themeNote: 'bentuk' },
]

export function gamesForUnit(unitIdx: number): MathGameDef[] {
  const ids = MATH_UNITS[unitIdx]?.games || []
  return ids.map(id => MATH_GAMES.find(g => g.id === id)!).filter(Boolean)
}
