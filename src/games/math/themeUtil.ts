import type { MathTheme } from '../../data/math'

export interface ThemeStyle {
  bg: string          // CSS gradient
  primary: string     // hex
  accent: string
  enemy: string       // emoji
  hero: string        // emoji
  cheer: string       // win emoji
}

export const THEMES: Record<MathTheme, ThemeStyle> = {
  army:   { bg: 'linear-gradient(180deg,#4a5d23,#2d3a14)', primary: '#7cb342', accent: '#ffd54f', enemy: '🎯', hero: '🪖', cheer: '🎖️' },
  jet:    { bg: 'linear-gradient(180deg,#1976d2,#0d47a1)', primary: '#42a5f5', accent: '#ff5252', enemy: '🛩️', hero: '✈️',  cheer: '🏆' },
  rocket: { bg: 'linear-gradient(180deg,#1a0033,#000)',    primary: '#ab47bc', accent: '#ffeb3b', enemy: '👽', hero: '🚀',  cheer: '🌟' },
  race:   { bg: 'linear-gradient(180deg,#37474f,#102027)', primary: '#ef5350', accent: '#ffeb3b', enemy: '🚧', hero: '🏎️',  cheer: '🏁' },
  animal: { bg: 'linear-gradient(180deg,#66bb6a,#2e7d32)', primary: '#ffa726', accent: '#fff59d', enemy: '🐍', hero: '🐯',  cheer: '🎉' },
  pirate: { bg: 'linear-gradient(180deg,#3e2723,#1b0a05)', primary: '#ffb300', accent: '#d84315', enemy: '☠️', hero: '🏴‍☠️', cheer: '💰' },
  knight: { bg: 'linear-gradient(180deg,#455a64,#263238)', primary: '#90a4ae', accent: '#ffca28', enemy: '🐉', hero: '🛡️',  cheer: '👑' },
  farm:   { bg: 'linear-gradient(180deg,#8bc34a,#558b2f)', primary: '#ff7043', accent: '#fff176', enemy: '🐺', hero: '🐮',  cheer: '🌾' },
}

export function themeOf(t: MathTheme): ThemeStyle { return THEMES[t] }
