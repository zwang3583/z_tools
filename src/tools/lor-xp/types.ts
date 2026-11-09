export const CAMPAIGNS = [
  { id: 'world', name: 'World Adventures' },
  { id: 'nightmare', name: 'Nightmare Adventures' },
  { id: 'legends-of-arcane', name: 'Legends of Arcane' },
  { id: 'titans-of-runeterra', name: 'Titans of Runeterra' },
  { id: 'rogues-of-runeterra', name: 'Rogues of Runeterra' },
  { id: 'spirit-blossom', name: 'Spirit Blossom' },
  { id: 'teamfight-adventures', name: 'Teamfight Adventures' },
  { id: 'wicked-path', name: 'The Wicked Path' },
] as const

export type CampaignId = (typeof CAMPAIGNS)[number]['id']

export interface Adventure {
  id: string
  name: string
  campaign: CampaignId
  stars: number
  /** XP for a completed run; for adventures with two routes, the longer route. */
  xp: number
  /** XP for the shorter route when the adventure has two, otherwise null. */
  shortPathXp: number | null
  /** Null for values not yet on the wiki, which come from scripts/lor-manual-adventures.json. */
  wikiUrl: string | null
}

export const MULTIPLIERS = [5, 10, 15, 20, 25, 30] as const
export type Multiplier = (typeof MULTIPLIERS)[number]

/** What the game shows: a level and the XP earned toward the next one. */
export interface Progress {
  level: number
  xpIntoLevel: number
}

export interface PlanRow {
  adventure: Adventure
  runs: Record<Multiplier, number>
}

export interface Plan {
  xpRemaining: number
  rows: PlanRow[]
  /** Per multiplier: the fewest runs any listed adventure needs, and which adventures achieve it. */
  best: Record<Multiplier, { runs: number; adventureIds: string[] }>
}
