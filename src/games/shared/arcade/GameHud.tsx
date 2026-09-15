// Shared React chrome for the action games: mission briefing screen,
// in-game HUD strip (stat / prompt / progress + mute), shield row.
// Canvas art stays inside the games; this is the consistent frame.
import { useEffect, useState } from 'react'
import { Volume2, VolumeX, Shield, type LucideIcon } from 'lucide-react'
import { isMuted, onMuteChange, setMuted } from '../../../hooks/useSound'

export function useMuted(): boolean {
  const [m, setM] = useState(isMuted())
  useEffect(() => onMuteChange(setM), [])
  return m
}

export function MuteButton() {
  const m = useMuted()
  return (
    <button
      onClick={() => setMuted(!m)}
      aria-label={m ? 'Unmute sounds' : 'Mute sounds'}
      className="w-10 h-10 rounded-2xl bg-clay-surface border-2 border-white/70 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
    >
      {m ? <VolumeX className="w-5 h-5 text-clay-error" strokeWidth={2.5} /> : <Volume2 className="w-5 h-5 text-clay-primary" strokeWidth={2.5} />}
    </button>
  )
}

export function ShieldRow({ shields, total = 3 }: { shields: number; total?: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Shields: ${shields}/${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Shield
          key={i}
          className={`w-4 h-4 ${i < shields ? 'text-sky-500' : 'text-clay-text-muted/25'}`}
          fill={i < shields ? 'currentColor' : 'none'}
          strokeWidth={2.5}
        />
      ))}
    </span>
  )
}

export interface PromptProps {
  emoji: string | null
  onHear: () => void
}

/** The round prompt: picture + spoken word. Never shows the written word. */
export function PromptChip({ emoji, onHear }: PromptProps) {
  return (
    <div className="flex items-center gap-2">
      <span key={emoji ?? 'q'} className="text-4xl animate-pop-in select-none">{emoji ?? '👂'}</span>
      <button
        onClick={onHear}
        className="clay-card-interactive flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-clay-text border-3 border-white/80"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <Volume2 className="w-6 h-6 text-clay-primary" strokeWidth={2.5} /> Hear it
      </button>
    </div>
  )
}

export interface GameHudProps {
  statIcon: LucideIcon
  statLabel: string
  statColor?: string
  shields?: number
  prompt: PromptProps | null
  progress?: string
}

export function GameHud({ statIcon: Icon, statLabel, statColor = 'text-clay-cta', shields, prompt, progress }: GameHudProps) {
  return (
    <div className="clay-card px-4 py-2 w-full flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-lg font-extrabold text-clay-text min-w-fit" style={{ fontFamily: 'var(--font-display)' }}>
        <Icon className={`w-5 h-5 ${statColor}`} strokeWidth={2.5} />
        <span>{statLabel}</span>
        {shields !== undefined && <ShieldRow shields={shields} />}
      </div>
      {prompt ? <div className="mx-auto"><PromptChip {...prompt} /></div> : <div />}
      <div className="flex items-center gap-2 min-w-fit">
        {progress && <span className="text-clay-text-muted font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{progress}</span>}
        <MuteButton />
      </div>
    </div>
  )
}

export interface Order {
  icon: LucideIcon
  text: string
}

export interface BriefingProps {
  title: string
  callsign: string
  hero: string          // emoji hero
  heroImg?: string      // optional sprite art under/next to hero emoji
  orders: Order[]
  cta: string
  gradient: string      // tailwind gradient classes, e.g. 'from-indigo-950 via-indigo-900 to-purple-950'
  onStart: () => void
}

/** Themed mission briefing: what to do, big animated start button. */
export function MissionBriefing({ title, callsign, hero, heroImg, orders, cta, gradient, onStart }: BriefingProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border-4 border-white/80 shadow-clay-card max-w-md w-full mx-auto text-center bg-gradient-to-br ${gradient} text-white animate-slide-up`}>
      {/* starfield dots */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" aria-hidden>
        {['10% 18%', '78% 12%', '30% 70%', '88% 55%', '55% 30%', '15% 45%', '68% 82%'].map((pos, i) => (
          <span key={i} className="absolute w-1.5 h-1.5 rounded-full bg-white animate-pulse-soft" style={{ left: pos.split(' ')[0], top: pos.split(' ')[1], animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>

      <div className="relative p-6 space-y-4">
        <span className="inline-block bg-white/15 border-2 border-white/30 backdrop-blur-sm text-amber-300 font-extrabold text-xs tracking-widest px-3 py-1 rounded-full" style={{ fontFamily: 'var(--font-display)' }}>
          ⚡ MISSION BRIEFING
        </span>

        <div className="flex items-end justify-center gap-3">
          {heroImg && <img src={heroImg} alt="" className="w-20 h-20 object-contain drop-shadow-2xl animate-float hidden sm:block" />}
          <span className="text-7xl drop-shadow-2xl animate-float" style={{ animationDelay: '0.3s' }}>{hero}</span>
        </div>

        <div>
          <p className="text-amber-300 font-extrabold text-sm tracking-widest uppercase" style={{ fontFamily: 'var(--font-display)' }}>{callsign}</p>
          <h2 className="text-3xl font-extrabold drop-shadow-md" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
        </div>

        <ul className="text-left space-y-2.5 bg-white/10 border-2 border-white/20 rounded-2xl p-4 backdrop-blur-sm">
          {orders.map((o, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-white/20 border-2 border-white/25 flex items-center justify-center">
                <o.icon className="w-5 h-5 text-amber-300" strokeWidth={2.5} />
              </span>
              <span className="text-base font-bold leading-snug pt-1" style={{ fontFamily: 'var(--font-display)' }}>{o.text}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onStart}
          className="clay-button px-8 py-4 text-xl font-extrabold w-full flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] transition-transform"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {cta}
        </button>
        <div className="pb-1"><MuteButton /></div>
      </div>
    </div>
  )
}
