import type { LessonTopic, QuizQuestion } from '../utils/types'

export const lessons: LessonTopic[] = [
  {
    unit: 1, title: 'Hello!',
    words: ['hello', 'goodbye', 'hi', 'bye', 'good', 'morning', 'afternoon', 'name', 'friend', 'teacher'],
    phrases: ['Hello, I am Ali.', 'Goodbye, see you!', 'Good morning, teacher.', 'How are you?', 'I am fine, thank you.'],
    sentences: ['Hello, my name is ___ .', 'Good morning, ___ .', 'Goodbye, ___ !', 'How are you today?'],
    phonics: [{ sound: 'a', words: ['ant', 'apple', 'alligator'] }, { sound: 's', words: ['snake', 'sun', 'sit'] }],
  },
  {
    unit: 2, title: 'My Body',
    words: ['head', 'eyes', 'nose', 'mouth', 'ears', 'hands', 'feet', 'fingers', 'toes', 'hair', 'face', 'arms', 'legs'],
    phrases: ['Touch your head.', 'Point to your nose.', 'Clap your hands.', 'Stamp your feet.', 'Wiggle your fingers.'],
    sentences: ['I have two ___ .', 'This is my ___ .', 'These are my ___ .', 'Point to your ___ .'],
    phonics: [{ sound: 't', words: ['tap', 'top', 'ten'] }, { sound: 'p', words: ['pat', 'pen', 'pet'] }],
  },
  {
    unit: 3, title: 'My Family',
    words: ['father', 'mother', 'brother', 'sister', 'baby', 'grandfather', 'grandmother', 'uncle', 'aunt', 'family', 'love', 'home'],
    phrases: ['This is my father.', 'I love my mother.', 'My brother is five.', 'She is my sister.', 'We are a family.'],
    sentences: ['This is my ___ .', 'My ___ is ___ years old.', 'I love my ___ .', 'We live in a ___ .'],
    phonics: [{ sound: 'i', words: ['in', 'it', 'is', 'igloo'] }, { sound: 'n', words: ['no', 'net', 'nap', 'nose'] }],
  },
  {
    unit: 4, title: 'Colours',
    words: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'grey', 'rainbow'],
    phrases: ['The ball is red.', 'I like blue.', 'A yellow sun.', 'Green grass.', 'Purple flower.'],
    sentences: ['The ___ is ___ .', 'I like the colour ___ .', 'My favourite colour is ___ .', 'The rainbow has ___ colours.'],
    phonics: [{ sound: 'm', words: ['mat', 'mop', 'map', 'moon'] }, { sound: 'd', words: ['dog', 'dot', 'dad', 'duck'] }],
  },
  {
    unit: 5, title: 'Numbers 1-10',
    words: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'count', 'how many'],
    phrases: ['One apple.', 'Two cats.', 'Three books.', 'Count to ten.', 'How many pens?'],
    sentences: ['I have ___ ___ .', 'There are ___ ___ .', 'How many ___ are there?', '___ and ___ makes ___ .'],
    phonics: [{ sound: 'c/k', words: ['cat', 'kite', 'cup', 'king'] }, { sound: 'ck', words: ['duck', 'sock', 'kick', 'back'] }],
  },
  {
    unit: 6, title: 'Animals',
    words: ['cat', 'dog', 'fish', 'bird', 'rabbit', 'duck', 'frog', 'cow', 'horse', 'sheep', 'chicken', 'elephant', 'monkey', 'snake', 'tiger'],
    phrases: ['I like cats.', 'The dog is big.', 'A fish can swim.', 'The bird can fly.', 'Look at the rabbit!'],
    sentences: ['My favourite animal is ___ .', 'The ___ can ___ .', 'I have a pet ___ .', 'The ___ says ___ .'],
    phonics: [{ sound: 'e', words: ['egg', 'elf', 'elephant', 'end'] }, { sound: 'h', words: ['hat', 'hen', 'hot', 'hop'] }],
  },
  {
    unit: 7, title: 'My Classroom',
    words: ['book', 'pen', 'pencil', 'ruler', 'eraser', 'bag', 'desk', 'chair', 'board', 'teacher', 'pupil', 'classroom'],
    phrases: ['Open your book.', 'Pick up the pencil.', 'Put it in your bag.', 'Sit on your chair.', 'Write on the board.'],
    sentences: ['This is my ___ .', 'Please give me the ___ .', 'I have a ___ in my bag.', 'The ___ is on the desk.'],
    phonics: [{ sound: 'r', words: ['rat', 'run', 'red', 'rug'] }, { sound: 'u', words: ['up', 'umbrella', 'under'] }],
  },
  {
    unit: 8, title: 'Food & Drinks',
    words: ['rice', 'bread', 'noodle', 'cake', 'egg', 'milk', 'water', 'juice', 'apple', 'banana', 'orange', 'mango', 'eat', 'drink'],
    phrases: ['I like rice.', 'Drink your milk.', 'The apple is sweet.', 'I eat bread.', 'I am hungry.'],
    sentences: ['I like to eat ___ .', 'I like to drink ___ .', 'The ___ is yummy!', 'My favourite food is ___ .'],
    phonics: [{ sound: 'f', words: ['fan', 'fun', 'fish', 'frog'] }, { sound: 'ff', words: ['huff', 'puff', 'cuff'] }],
  },
  {
    unit: 9, title: 'Clothes',
    words: ['shirt', 'pants', 'shorts', 'dress', 'shoes', 'socks', 'hat', 'cap', 'skirt', 'jacket', 'wear', 'put on'],
    phrases: ['I wear a shirt.', 'Put on your shoes.', 'The dress is pretty.', 'My hat is blue.', 'Take off your socks.'],
    sentences: ['I wear ___ to school.', 'My ___ is / are ___ .', 'Put on your ___ .', 'Take off your ___ .'],
    phonics: [{ sound: 'l', words: ['leg', 'log', 'lip', 'lamp'] }, { sound: 'll', words: ['bell', 'fill', 'doll'] }],
  },
  {
    unit: 10, title: 'Toys & Play',
    words: ['ball', 'doll', 'car', 'kite', 'bike', 'teddy', 'train', 'blocks', 'puzzle', 'game', 'play', 'fun', 'share'],
    phrases: ['Let us play!', 'I have a ball.', 'The kite is flying.', 'My teddy is soft.', 'Can I play?'],
    sentences: ['I like to play with ___ .', 'My favourite toy is ___ .', 'Let us ___ together.', 'Can I have the ___ ?'],
    phonics: [{ sound: 'ss', words: ['kiss', 'miss', 'boss', 'grass'] }, { sound: 'j', words: ['jam', 'jet', 'jump', 'jug'] }],
  },
  {
    unit: 11, title: 'Free Time',
    words: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'read', 'sing', 'dance', 'swim', 'play', 'run', 'jump', 'draw', 'weekend'],
    phrases: ['I go swimming on Saturdays.', 'I play football on Fridays.', 'I ride my bike on Sundays.', 'Do you play football?', 'I like to sing.'],
    sentences: ['On ___ , I ___ .', 'Do you ___ at the weekend?', 'I ___ on ___ .', 'My favourite day is ___ .'],
    phonics: [{ sound: 'ay', words: ['play', 'day', 'say', 'way'] }, { sound: 'ee', words: ['see', 'tree', 'three', 'green'] }],
  },
  {
    unit: 12, title: 'At Home',
    words: ['living room', 'kitchen', 'bedroom', 'bathroom', 'hall', 'stairs', 'cellar', 'dining room', 'house', 'door', 'window', 'garden'],
    phrases: ['There is a frog on the log.', 'There are three butterflies.', 'Is there a spider?', 'How many apples are there?', 'There is a cat in the tree.'],
    sentences: ['There is a ___ in the ___ .', 'There are ___ ___ .', 'Is there a ___ ?', 'How many ___ are there?'],
    phonics: [{ sound: 'h', words: ['house', 'hat', 'hot', 'happy', 'hall', 'help'] }, { sound: 'oo', words: ['room', 'school', 'food', 'pool'] }],
  },
  {
    unit: 13, title: 'Get Dressed!',
    words: ['T-shirt', 'shorts', 'socks', 'jeans', 'cap', 'trousers', 'skirt', 'shoes', 'jacket', 'sweater', 'hat', 'dress'],
    phrases: ['I like this T-shirt.', 'Do you like these jeans?', 'I am wearing a shirt.', 'She is wearing a dress.', 'These are my shoes.'],
    sentences: ['I like this ___ .', 'I like these ___ .', 'Do you like this ___ ?', 'She is wearing a ___ .'],
    phonics: [{ sound: 'st', words: ['stop', 'stairs', 'stand'] }, { sound: 'sh', words: ['shoes', 'shirt', 'shorts', 'sheep'] }],
  },
  {
    unit: 14, title: 'I Can Do It!',
    words: ['head', 'arm', 'hand', 'fingers', 'leg', 'knee', 'foot', 'toes', 'dance', 'skip', 'sing', 'swim', 'crawl', 'run', 'touch'],
    phrases: ['I can stand on one leg.', 'I can touch my toes.', 'Can you skip?', 'Yes, I can.', 'I can dance and sing.'],
    sentences: ['I can ___ .', 'I cannot ___ .', 'Can you ___ ?', 'Yes, I can. / No, I cannot.'],
    phonics: [{ sound: 'g', words: ['grey', 'frog', 'game', 'leg', 'dog'] }, { sound: 'ee', words: ['knee', 'three', 'green'] }],
  },
  {
    unit: 15, title: 'At the Beach',
    words: ['beach', 'shell', 'sandcastle', 'sea', 'fish', 'photo', 'music', 'ice cream', 'book', 'guitar', 'hat', 'sun', 'hot', 'cold'],
    phrases: ['Look for shells.', 'Take a photo.', 'Catch a fish.', 'Make a sandcastle.', 'Eat ice cream.', 'Listen to music.', 'Read a book.', 'Paint a picture.'],
    sentences: ['Let us ___ .', 'Where is the ___ ?', 'It is a lovely day at the beach.', 'The sun is hot.'],
    phonics: [{ sound: 'ea', words: ['beach', 'sea', 'peas', 'read', 'ice cream', 'eat'] }, { sound: 'sh', words: ['shell', 'fish', 'shoes', 'shirt'] }],
  },
]

export function generateWordMatchQuestions(unit: LessonTopic): QuizQuestion[] {
  return unit.words.slice(0, 8).map(word => ({
    question: 'What is this word?',
    options: shuffleArray([word, ...getRandomWords(unit.words, word, 3)]),
    answer: word,
    emoji: wordEmoji(word),
  }))
}

export function generateSpellingQuestions(unit: LessonTopic): string[] {
  return unit.words.slice(0, 10)
}

export function generateScrambleQuestions(unit: LessonTopic): string[] {
  return unit.words.filter(w => w.length >= 3).slice(0, 8)
}

export function generateFillBlankQuestions(unit: LessonTopic): { sentence: string; answer: string; options: string[] }[] {
  return unit.sentences.slice(0, 6).map(s => {
    const words = unit.words.filter(w => s.toLowerCase().includes(w.toLowerCase()))
    const answer = words[0] || unit.words[0]
    const blanked = s.replace(new RegExp(answer, 'i'), '___')
    return { sentence: blanked, answer, options: shuffleArray([answer, ...getRandomWords(unit.words, answer, 3)]) }
  })
}

export function generateWordSearch(unit: LessonTopic): string[] {
  return unit.words.filter(w => w.length >= 3 && w.length <= 8).slice(0, 6)
}

export function generateHangmanWords(unit: LessonTopic): string[] {
  return unit.words.filter(w => w.length >= 3).slice(0, 10)
}

export function generateSpeedTypingWords(unit: LessonTopic): string[] {
  return shuffleArray([...unit.words])
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getRandomWords(words: string[], exclude: string, count: number): string[] {
  const pool = words.filter(w => w !== exclude)
  return shuffleArray(pool).slice(0, count)
}

function wordEmoji(word: string): string {
  const map: Record<string, string> = {
    hello: '👋', goodbye: '👋', hi: '🖐️', bye: '👋', friend: '👫', teacher: '👩‍🏫',
    head: '🗣️', eyes: '👀', nose: '👃', mouth: '👄', ears: '👂', hands: '🤲', feet: '🦶', fingers: '🤌', toes: '🦶', hair: '💇',
    father: '👨', mother: '👩', brother: '👦', sister: '👧', baby: '👶', grandfather: '👴', grandmother: '👵', family: '👨‍👩‍👧‍👦',
    red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', pink: '🩷', black: '⚫', white: '⚪', brown: '🟤',
    one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',
    cat: '🐱', dog: '🐶', fish: '🐟', bird: '🐦', rabbit: '🐰', duck: '🦆', frog: '🐸', cow: '🐮', horse: '🐴', sheep: '🐑', chicken: '🐔', elephant: '🐘', monkey: '🐵', snake: '🐍', tiger: '🐯',
    book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', eraser: '🧹', bag: '🎒', desk: '🪑', chair: '🪑', board: '📋',
    rice: '🍚', bread: '🍞', noodle: '🍜', cake: '🎂', egg: '🥚', milk: '🥛', water: '💧', juice: '🧃', apple: '🍎', banana: '🍌', mango: '🥭', eat: '🍽️', drink: '🥤',
    shirt: '👕', pants: '👖', shorts: '🩳', dress: '👗', shoes: '👟', socks: '🧦', hat: '🎩', cap: '🧢', skirt: '👗', jacket: '🧥',
    ball: '⚽', doll: '🪆', car: '🚗', kite: '🪁', bike: '🚲', teddy: '🧸', train: '🚂', blocks: '🧱', puzzle: '🧩', game: '🎮', play: '🤸',
    morning: '🌅', afternoon: '☀️', name: '📛', love: '❤️', home: '🏠', school: '🏫',
  }
  return map[word.toLowerCase()] || '📝'
}

export function getEmoji(word: string): string { return wordEmoji(word) }
