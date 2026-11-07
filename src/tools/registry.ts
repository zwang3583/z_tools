import type { ComponentType } from 'react'
import LorXpPage from './lor-xp/LorXpPage'

export interface Tool {
  path: string
  game: string
  title: string
  summary: string
  /** The game's spine colours: band is the field, ink is text on it. */
  hue: { band: string; ink: string; accent: string }
  Page: ComponentType
}

export const TOOLS: Tool[] = [
  {
    path: '/lor/xp',
    game: 'Legends of Runeterra',
    title: 'Champion XP planner',
    summary: 'Fewest Path of Champions runs to level a champion, from your exact XP.',
    hue: { band: '#0B1A33', ink: '#E9D8A6', accent: '#C8AA6E' },
    Page: LorXpPage,
  },
]
