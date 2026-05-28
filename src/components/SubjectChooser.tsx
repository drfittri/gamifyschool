import { useNavigate } from 'react-router-dom'

interface Subject {
  id: string
  title: string
  emoji: string
  tagline: string
  route: string
  bg: string
  ring: string
}

const SUBJECTS: Subject[] = [
  {
    id: 'english', title: 'English', emoji: '📚', tagline: 'Words, phonics & stories',
    route: '/english', bg: 'from-rose-400 via-pink-500 to-fuchsia-600', ring: 'ring-rose-300',
  },
  {
    id: 'math', title: 'Mathematics', emoji: '🔢', tagline: 'Numbers, shapes & time',
    route: '/math', bg: 'from-blue-500 via-indigo-600 to-purple-700', ring: 'ring-blue-300',
  },
]

export default function SubjectChooser() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-clay-bg bg-dots flex flex-col items-center p-6 relative overflow-hidden">
      <div className="absolute top-6 right-5 text-5xl opacity-20 animate-float pointer-events-none">🌟</div>
      <div className="absolute top-32 left-3 text-4xl opacity-15 animate-float pointer-events-none" style={{ animationDelay: '1.5s' }}>📚</div>
      <div className="absolute bottom-24 right-6 text-4xl opacity-15 animate-float pointer-events-none" style={{ animationDelay: '3s' }}>🔢</div>
      <div className="absolute bottom-10 left-8 text-4xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>✨</div>

      <header className="mt-8 mb-10 text-center">
        <div className="text-6xl mb-3 animate-sway">🎓</div>
        <h1 className="text-4xl font-extrabold text-clay-text" style={{ fontFamily: 'var(--font-display)' }}>GamifySchool</h1>
        <p className="text-clay-text-muted font-semibold mt-2">Pick a subject — start your adventure!</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {SUBJECTS.map(s => (
          <button
            key={s.id}
            onClick={() => navigate(s.route)}
            className={`group bg-gradient-to-br ${s.bg} rounded-3xl p-8 text-white shadow-xl hover:scale-105 active:scale-95 transition-all ring-4 ${s.ring} ring-opacity-30 hover:ring-opacity-80`}
          >
            <div className="text-7xl mb-4 group-hover:animate-bounce">{s.emoji}</div>
            <h2 className="text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{s.title}</h2>
            <p className="font-semibold opacity-90">{s.tagline}</p>
            <div className="mt-4 inline-block bg-white/20 px-4 py-1.5 rounded-full font-extrabold text-sm">Play ▶</div>
          </button>
        ))}
      </div>

      <p className="mt-auto pt-12 text-clay-text-muted text-xs font-semibold">Year 1 • English & Mathematics</p>
    </div>
  )
}
