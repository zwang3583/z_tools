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

export function xpAtLevel(level: number): number {
  return XP_AT_LEVEL[clampLevel(level) - 1]!
}

export const MAX_TOTAL_XP = xpAtLevel(MAX_LEVEL)

export function clampExp(totalExp: number): number {
  return Number.isFinite(totalExp) ? Math.min(MAX_TOTAL_XP, Math.max(0, Math.trunc(totalExp))) : 0
}

export function levelAt(totalExp: number): Progress {
  const exp = clampExp(totalExp)
  let level = 1
  while (level < MAX_LEVEL && xpAtLevel(level + 1) <= exp) level++
  return { level, xpIntoLevel: exp - xpAtLevel(level) }
}

export function xpRemaining(totalExp: number, targetLevel: number): number {
  return Math.max(0, xpAtLevel(targetLevel) - clampExp(totalExp))
}

export function runsNeeded(remaining: number, xpPerRun: number): number {
  if (remaining <= 0) return 0
  return xpPerRun > 0 ? Math.ceil(remaining / xpPerRun) : Number.POSITIVE_INFINITY
}

function perMultiplier<T>(f: (m: Multiplier) => T): Record<Multiplier, T> {
  return Object.fromEntries(MULTIPLIERS.map((m) => [m, f(m)])) as Record<Multiplier, T>
}

export function clampBonus(bonusPct: number): number {
  return Number.isFinite(bonusPct) ? Math.max(0, Math.trunc(bonusPct)) : 0
}

export function xpPerRun(baseXp: number, multiplier: number, bonusPct = 0): number {
  return Math.floor((baseXp * (100 + clampBonus(bonusPct) + 100 * multiplier)) / 100)
}

export function plan(totalExp: number, targetLevel: number, adventures: Adventure[], bonusPct = 0): Plan {
  const remaining = xpRemaining(totalExp, targetLevel)
  const rows = adventures.map((adventure) => ({
    adventure,
    runs: perMultiplier((m) => runsNeeded(remaining, xpPerRun(adventure.xp, m, bonusPct))),
  }))
  const best = perMultiplier((m) => {
    if (remaining === 0) return { runs: 0, adventureIds: [] }
    const runs = Math.min(...rows.map((r) => r.runs[m]))
    return { runs, adventureIds: rows.filter((r) => r.runs[m] === runs).map((r) => r.adventure.id) }
  })
  return { xpRemaining: remaining, rows, best }
}
