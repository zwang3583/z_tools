import { describe, expect, it } from 'vitest'
import {
  ADVENTURES,
  MAX_LEVEL,
  MAX_TOTAL_XP,
  clampExp,
  levelAt,
  plan,
  runsNeeded,
  xpAtLevel,
  xpRemaining,
  xpToNext,
} from './model'
import { MULTIPLIERS, type Adventure } from './types'

const byName = (name: string, campaign?: string) => {
  const found = ADVENTURES.filter((a) => a.name === name && (!campaign || a.campaign === campaign))
  expect(found).toHaveLength(1)
  return found[0]!
}

const adventure = (id: string, xp: number): Adventure => ({
  id,
  name: id,
  campaign: 'world',
  stars: 1,
  xp,
  shortPathXp: null,
  wikiUrl: '',
})

describe('level table', () => {
  it('matches the wiki', () => {
    expect(MAX_LEVEL).toBe(50)
    expect(xpToNext(1)).toBe(50)
    expect(xpToNext(30)).toBe(5850)
    expect(xpToNext(49)).toBe(54800)
    expect(xpToNext(MAX_LEVEL)).toBe(0)
    expect(xpAtLevel(30)).toBe(51290)
    expect(xpAtLevel(50)).toBe(552670)
    expect(MAX_TOTAL_XP).toBe(552670)
  })
})

describe('xpRemaining', () => {
  it('needs the whole table from a fresh champion', () => {
    expect(xpRemaining(0, 50)).toBe(552670)
  })

  it('subtracts the champion total', () => {
    expect(xpRemaining(52290, 50)).toBe(552670 - 52290)
  })

  it('is 1 when one xp short of the target', () => {
    expect(xpRemaining(51290 + 5849, 31)).toBe(1)
  })

  it('is 0 when the target is at or below the current level', () => {
    expect(xpRemaining(51390, 30)).toBe(0)
    expect(xpRemaining(51390, 12)).toBe(0)
  })
})

describe('levelAt', () => {
  it('derives the level and progress the game would show', () => {
    expect(levelAt(0)).toEqual({ level: 1, xpIntoLevel: 0 })
    expect(levelAt(49)).toEqual({ level: 1, xpIntoLevel: 49 })
    expect(levelAt(50)).toEqual({ level: 2, xpIntoLevel: 0 })
    expect(levelAt(52290)).toEqual({ level: 30, xpIntoLevel: 1000 })
    expect(levelAt(552669)).toEqual({ level: 49, xpIntoLevel: 54799 })
    expect(levelAt(552670)).toEqual({ level: 50, xpIntoLevel: 0 })
  })
})

describe('clampExp', () => {
  it('keeps totals between 0 and the max-level total', () => {
    expect(clampExp(-5)).toBe(0)
    expect(clampExp(1234.9)).toBe(1234)
    expect(clampExp(9999999)).toBe(552670)
    expect(clampExp(NaN)).toBe(0)
  })
})

describe('runsNeeded', () => {
  it('rounds up to whole runs', () => {
    expect(runsNeeded(0, 500)).toBe(0)
    expect(runsNeeded(1000, 500)).toBe(2)
    expect(runsNeeded(1001, 500)).toBe(3)
    expect(runsNeeded(1, 500)).toBe(1)
  })
})

describe('plan', () => {
  it('computes runs per multiplier from exact integer xp', () => {
    const p = plan(51290, 31, [adventure('a', 117)])
    expect(p.xpRemaining).toBe(5850)
    expect(p.rows[0]!.runs).toEqual({ 5: 10, 10: 5, 15: 4, 20: 3, 25: 2, 30: 2 })
  })

  it('reports every adventure tied for fewest runs', () => {
    const p = plan(51290, 31, [
      adventure('small', 100),
      adventure('big', 1200),
      adventure('alsoBig', 1170),
    ])
    expect(p.best[5]).toEqual({ runs: 1, adventureIds: ['big', 'alsoBig'] })
  })

  it('has zero runs everywhere when the target is reached', () => {
    const p = plan(552670, 50, ADVENTURES)
    for (const m of MULTIPLIERS) expect(p.best[m]).toEqual({ runs: 0, adventureIds: [] })
    expect(p.rows.every((r) => MULTIPLIERS.every((m) => r.runs[m] === 0))).toBe(true)
  })

  it('reports infinite runs when no adventures are given and xp remains', () => {
    const p = plan(0, 2, [])
    expect(p.rows).toEqual([])
    expect(p.best[10]).toEqual({ runs: Number.POSITIVE_INFINITY, adventureIds: [] })
  })
})

describe('adventure data', () => {
  it('matches values verified on the wiki', () => {
    expect(byName('The Swift Scout')).toMatchObject({ xp: 100, stars: 0, shortPathXp: null })
    expect(byName('The Master of Shadows')).toMatchObject({ xp: 1110, shortPathXp: 985 })
    expect(byName('The Machine Herald')).toMatchObject({ xp: 1425, shortPathXp: 1245 })
    expect(byName('The Frost Witch')).toMatchObject({ xp: 5925, shortPathXp: 4360 })
    expect(byName('With Friends Like These...')).toMatchObject({ xp: 11970, stars: 10, campaign: 'nightmare' })
    expect(byName('The Deep Voice Below the Waves', 'nightmare')).toMatchObject({ xp: 5230, stars: 6 })
    expect(byName('The Star Forger', 'legends-of-arcane')).toMatchObject({ xp: 10670, stars: 6.5 })
  })

  it('has unique ids and positive integer xp', () => {
    expect(new Set(ADVENTURES.map((a) => a.id)).size).toBe(ADVENTURES.length)
    for (const a of ADVENTURES) expect(Number.isInteger(a.xp) && a.xp > 0).toBe(true)
  })
})
