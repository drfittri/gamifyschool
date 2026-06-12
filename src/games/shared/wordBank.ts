// Shared question helpers so games can ask real questions
// (picture/audio prompt → pick the written word) instead of
// showing the answer on screen.

export const WORD_EMOJI: Record<string, string> = {
  hello: '👋', goodbye: '👋', hi: '🖐️', bye: '👋', friend: '👫', teacher: '👩‍🏫', name: '📛', morning: '🌅', afternoon: '☀️',
  head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶', hair: '💇', arms: '💪', legs: '🦵', fingers: '🖐️', toes: '🦶', face: '🙂',
  father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', grandfather: '👴', grandmother: '👵', uncle: '🧔', aunt: '👱‍♀️', family: '👨‍👩‍👧‍👦', love: '❤️', home: '🏠',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤', grey: '🩶', rainbow: '🌈',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟', count: '🔢',
  cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', chicken: '🐔', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯', spider: '🕷️', rat: '🐀', lizard: '🦎', ant: '🐜', alligator: '🐊', hen: '🐔',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', rubber: '🧹', eraser: '🧽', bag: '🎒', desk: '🪑', chair: '🪑', board: '🖼️', notebook: '📓', pupil: '🧒', classroom: '🏫',
  rice: '🍚', bread: '🍞', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', pizza: '🍕', cheese: '🧀', sandwich: '🥪', sausages: '🌭', peas: '🟢', carrots: '🥕', cup: '☕',
  shirt: '👕', pants: '👖', dress: '👗', shoes: '👟', socks: '🧦', sock: '🧦', hat: '🎩',
  ball: '⚽', doll: '🪆', car: '🚗', bike: '🚲', kite: '🪁', teddy: '🧸', train: '🚂', plane: '✈️', monster: '👾',
  sing: '🎤', dance: '💃', read: '📖', write: '📝', draw: '🎨', swim: '🏊', run: '🏃', jump: '🦘', eat: '🍽️', drink: '🥤', sit: '🪑', hop: '🐇', nap: '😴',
  big: '🐘', small: '🐜', long: '🐍', short: '📏', new: '✨', old: '📜', beautiful: '💐', hot: '🔥', cold: '🧊',
  sun: '☀️', moon: '🌙', map: '🗺️', mop: '🧹', net: '🥅', king: '👑', elf: '🧝', mat: '🟫', dad: '👨', pet: '🐾', tap: '🚰',
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface Round {
  word: string
  emoji: string | null
  options: string[]
}

// Fallback distractors when a unit has very few words.
const FILLER = ['cat', 'sun', 'red', 'ball', 'milk', 'hat', 'dog', 'bus']

/**
 * Build question rounds from a unit's word list.
 * Prefers words that have a picture (emoji); words without one are
 * still answerable because every game speaks the word aloud (TTS).
 */
export function makeRounds(words: string[], roundCount: number, optionCount: number): Round[] {
  const pool = [...new Set(words.filter(w => !w.includes(' ')))]
  const withEmoji = pool.filter(w => WORD_EMOJI[w.toLowerCase()])
  const source = withEmoji.length >= Math.min(4, pool.length) ? withEmoji : pool
  const rounds: Round[] = []
  let bag: string[] = []
  for (let i = 0; i < roundCount; i++) {
    if (bag.length === 0) bag = shuffle(source)
    const word = bag.pop()!
    const distractors = shuffle(pool.filter(w => w !== word)).slice(0, optionCount - 1)
    let f = 0
    while (distractors.length < optionCount - 1 && f < FILLER.length) {
      const cand = FILLER[f++]
      if (cand !== word && !distractors.includes(cand)) distractors.push(cand)
    }
    rounds.push({
      word,
      emoji: WORD_EMOJI[word.toLowerCase()] ?? null,
      options: shuffle([word, ...distractors]),
    })
  }
  return rounds
}

export const ASSET = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`
