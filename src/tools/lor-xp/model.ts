import adventuresJson from './data/adventures.json'
import levelsJson from './data/levels.json'
import { MULTIPLIERS, type Adventure, type Multiplier, type Plan, type Progress } from './types'

export const ADVENTURES = adventuresJson as Adventure[]

const XP_TO_NEXT: readonly number[] = levelsJson.xpToNext
const XP_AT_LEVEL: readonly number[] = XP_TO_NEXT.reduce((acc, xp) => [...acc, acc.at(-1)! + xp], [0])

export const MAX_LEVEL = XP_TO_NEXT.length + 1

function clampLevel(level: number): number {
  return Number.isFinite(level) ? Math.min(MAX_LEVEL, Math.max(1, Math.trunc(level))) : 1
}

export function xpToNext(level: number): number {
  return XP_TO_NEXT[clampLevel(level) - 1] ?? 0
}

export function totalXp(p: Progress): number {
  return XP_AT_LEVEL[clampLevel(p.level) - 1]! + p.xpIntoLevel
}

export function normalizeProgress(level: number, xpIntoLevel: number): Progress {
  const l = clampLevel(level)
  const cap = Math.max(0, xpToNext(l) - 1)
  const xp = Number.isFinite(xpIntoLevel) ? Math.min(cap, Math.max(0, Math.trunc(xpIntoLevel))) : 0
  return { level: l, xpIntoLevel: xp }
}

export function xpRemaining(from: Progress, targetLevel: number): number {
  return Math.max(0, totalXp({ level: targetLevel, xpIntoLevel: 0 }) - totalXp(from))
}

export function runsNeeded(remaining: number, xpPerRun: number): number {
  if (remaining <= 0) return 0
  return xpPerRun > 0 ? Math.ceil(remaining / xpPerRun) : Number.POSITIVE_INFINITY
}

function perMultiplier<T>(f: (m: Multiplier) => T): Record<Multiplier, T> {
  return Object.fromEntries(MULTIPLIERS.map((m) => [m, f(m)])) as Record<Multiplier, T>
}

export function plan(from: Progress, targetLevel: number, adventures: Adventure[]): Plan {
  const remaining = xpRemaining(from, targetLevel)
  const rows = adventures.map((adventure) => ({
    adventure,
    runs: perMultiplier((m) => runsNeeded(remaining, adventure.xp * m)),
  }))
  const best = perMultiplier((m) => {
    if (remaining === 0) return { runs: 0, adventureIds: [] }
    const runs = Math.min(...rows.map((r) => r.runs[m]))
    return { runs, adventureIds: rows.filter((r) => r.runs[m] === runs).map((r) => r.adventure.id) }
  })
  return { xpRemaining: remaining, rows, best }
}
