import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ADVENTURES, MAX_LEVEL, normalizeProgress, plan, totalXp, xpToNext } from './model'
import { CAMPAIGNS, MULTIPLIERS, type Adventure, type CampaignId, type Multiplier } from './types'

type SortKey = 'xp' | 'stars' | 'name'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }

const fmt = new Intl.NumberFormat('en-US')
const campaignName = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c.name])) as Record<CampaignId, string>
const campaignOrder = Object.fromEntries(CAMPAIGNS.map((c, i) => [c.id, i])) as Record<CampaignId, number>
const wikiOrder = new Map(ADVENTURES.map((a, i) => [a.id, i]))
const starSteps = [...new Set(ADVENTURES.map((a) => a.stars))].filter((s) => s >= 2).sort((a, b) => a - b)

const digits = (raw: string) => raw.replace(/[^\d]/g, '')
const toInt = (raw: string, fallback: number) => (digits(raw) === '' ? fallback : Number(digits(raw)))

function compare(sort: Sort) {
  const sign = sort.dir === 'asc' ? 1 : -1
  return (a: Adventure, b: Adventure) => {
    const primary =
      sort.key === 'name' ? a.name.localeCompare(b.name) : sort.key === 'stars' ? a.stars - b.stars : a.xp - b.xp
    if (primary !== 0) return primary * sign
    return campaignOrder[a.campaign] - campaignOrder[b.campaign] || wikiOrder.get(a.id)! - wikiOrder.get(b.id)!
  }
}

function Star() {
  return (
    <svg className="star" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.9l-4.2 2.3.8-4.7L1.2 6.2l4.7-.7z" />
    </svg>
  )
}

function SortHeader({ label, k, sort, onSort, className }: {
  label: string
  k: SortKey
  sort: Sort
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = sort.key === k
  return (
    <th scope="col" className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort" onClick={() => onSort(k)}>
        {label}
        <svg className={`sort-icon${active ? ' is-active' : ''}${active && sort.dir === 'asc' ? ' is-asc' : ''}`} viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>
    </th>
  )
}

export default function LorXpPage() {
  const [params, setParams] = useSearchParams()
  const [levelRaw, setLevelRaw] = useState(params.get('level') ?? '1')
  const [xpRaw, setXpRaw] = useState(params.get('xp') ?? '0')
  const [targetRaw, setTargetRaw] = useState(params.get('target') ?? String(MAX_LEVEL))
  const [off, setOff] = useState<Set<CampaignId>>(new Set())
  const [maxStars, setMaxStars] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort>({ key: 'xp', dir: 'desc' })

  const sync = (next: { level?: string; xp?: string; target?: string }) => {
    const merged = { level: levelRaw, xp: xpRaw, target: targetRaw, ...next }
    setParams({ level: digits(merged.level), xp: digits(merged.xp), target: digits(merged.target) }, { replace: true })
  }

  const progress = normalizeProgress(toInt(levelRaw, 1), toInt(xpRaw, 0))
  const target = Math.min(MAX_LEVEL, Math.max(1, toInt(targetRaw, MAX_LEVEL)))
  const cap = xpToNext(progress.level)
  const xpClamped = cap > 0 && digits(xpRaw) !== '' && toInt(xpRaw, 0) !== progress.xpIntoLevel
  const levelClamped = digits(levelRaw) !== '' && toInt(levelRaw, 1) !== progress.level

  const pool = useMemo(
    () => ADVENTURES.filter((a) => !off.has(a.campaign) && (maxStars === null || a.stars <= maxStars)),
    [off, maxStars],
  )
  const result = useMemo(() => plan(progress, target, pool), [progress.level, progress.xpIntoLevel, target, pool])
  const rows = useMemo(() => [...result.rows].sort((a, b) => compare(sort)(a.adventure, b.adventure)), [result, sort])
  const byId = useMemo(() => new Map(ADVENTURES.map((a) => [a.id, a])), [])
  const done = result.xpRemaining === 0

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))

  const toggle = (id: CampaignId) =>
    setOff((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const isBest = (runs: number, m: Multiplier) => !done && result.best[m].adventureIds.length > 0 && runs === result.best[m].runs

  return (
    <main className="page lor">
      <section className="inputs" aria-labelledby="inputs-heading">
        <h2 id="inputs-heading" className="visually-hidden">Your champion</h2>
        <div className="field">
          <label htmlFor="level">Current level</label>
          <input
            id="level"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_LEVEL}
            value={levelRaw}
            onChange={(e) => {
              setLevelRaw(e.target.value)
              sync({ level: e.target.value })
            }}
            onBlur={() => setLevelRaw(String(progress.level))}
            aria-describedby="level-hint"
          />
          <p id="level-hint" className={`hint${levelClamped ? ' is-warn' : ''}`}>
            {levelClamped ? `Levels run 1 to ${MAX_LEVEL}; using ${progress.level}.` : `1 to ${MAX_LEVEL}`}
          </p>
        </div>

        <div className="field">
          <label htmlFor="xp">XP into this level</label>
          <div className="xp-input">
            <input
              id="xp"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cap === 0 ? '0' : xpRaw}
              disabled={cap === 0}
              onChange={(e) => {
                setXpRaw(e.target.value)
                sync({ xp: e.target.value })
              }}
              onBlur={() => setXpRaw(fmt.format(progress.xpIntoLevel))}
              aria-describedby="xp-hint"
            />
            <span className="xp-cap">/ {cap === 0 ? 'max' : fmt.format(cap)}</span>
          </div>
          <p id="xp-hint" className={`hint${xpClamped ? ' is-warn' : ''}`}>
            {cap === 0
              ? 'Max level reached.'
              : xpClamped
                ? `Level ${progress.level} holds at most ${fmt.format(cap - 1)} XP; using that.`
                : 'As shown on your XP bar.'}
          </p>
        </div>

        <div className="field">
          <label htmlFor="target">Target level</label>
          <input
            id="target"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_LEVEL}
            value={targetRaw}
            onChange={(e) => {
              setTargetRaw(e.target.value)
              sync({ target: e.target.value })
            }}
            onBlur={() => setTargetRaw(String(target))}
          />
          <p className="hint">{target === MAX_LEVEL ? 'Max level' : `Max is ${MAX_LEVEL}`}</p>
        </div>

        <dl className="totals">
          <div>
            <dt>XP to go</dt>
            <dd className="totals-main">{fmt.format(result.xpRemaining)}</dd>
          </div>
          <div>
            <dt>Earned so far</dt>
            <dd>{fmt.format(totalXp(progress))}</dd>
          </div>
        </dl>
      </section>

      <section className="best" aria-labelledby="best-heading">
        <div className="section-head">
          <h2 id="best-heading">Fewest runs</h2>
          <p className="section-note">Best adventure at each XP multiplier, from the adventures listed below.</p>
        </div>
        {done ? (
          <p className="empty">
            {progress.level === MAX_LEVEL
              ? `Level ${MAX_LEVEL} is the max. This champion has nothing left to earn.`
              : `Already at level ${progress.level}. Raise the target level to plan more runs.`}
          </p>
        ) : (
          <ol className="best-strip">
            {MULTIPLIERS.map((m) => {
              const b = result.best[m]
              const first = b.adventureIds[0] ? byId.get(b.adventureIds[0]) : undefined
              return (
                <li key={m} className="best-cell">
                  <span className="best-mult">{m}× XP</span>
                  {first ? (
                    <>
                      <span className="best-runs">
                        {fmt.format(b.runs)}
                        <span className="best-unit">{b.runs === 1 ? ' run' : ' runs'}</span>
                      </span>
                      <span className="best-name">{first.name}</span>
                      <span className="best-meta">
                        {b.adventureIds.length === 1
                          ? campaignName[first.campaign]
                          : b.adventureIds.length === 2
                            ? `Tied with ${byId.get(b.adventureIds[1]!)!.name}`
                            : `Tied with ${b.adventureIds.length - 1} others`}
                      </span>
                    </>
                  ) : (
                    <span className="best-meta">No adventures selected</span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="all" aria-labelledby="all-heading">
        <div className="section-head">
          <h2 id="all-heading">Every adventure</h2>
          <p className="section-note">
            Runs needed at each multiplier. Gold marks the fewest in each column. Turn off what you can't play yet.
          </p>
        </div>

        <div className="filters">
          <fieldset className="chips">
            <legend className="visually-hidden">Campaigns</legend>
            {CAMPAIGNS.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={!off.has(c.id)} onClick={() => toggle(c.id)}>
                <svg className="chip-check" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.5 6.2l2.3 2.3 4.7-4.9" />
                </svg>
                {c.name}
              </button>
            ))}
          </fieldset>
          <label className="select">
            <span>Difficulty</span>
            <select value={maxStars ?? ''} onChange={(e) => setMaxStars(e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">Any</option>
              {starSteps.map((s) => (
                <option key={s} value={s}>
                  Up to {s} stars
                </option>
              ))}
            </select>
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="empty">No adventures match these filters. Turn a campaign back on or raise the difficulty.</p>
        ) : (
          <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="all-heading">
            <table className="table">
              <thead>
                <tr>
                  <SortHeader label="Adventure" k="name" sort={sort} onSort={onSort} className="col-name" />
                  <SortHeader label="Stars" k="stars" sort={sort} onSort={onSort} className="num col-stars" />
                  <SortHeader label="XP / run" k="xp" sort={sort} onSort={onSort} className="num" />
                  {MULTIPLIERS.map((m) => (
                    <th key={m} scope="col" className="num col-mult">
                      {m}×
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ adventure: a, runs }) => (
                  <tr key={a.id}>
                    <th scope="row" className="col-name">
                      <a href={a.wikiUrl} target="_blank" rel="noreferrer" className="adv-name">
                        {a.name}
                      </a>
                      <span className="adv-campaign">
                        <span className="adv-campaign-name">{campaignName[a.campaign]}</span>
                        <span className="adv-stars-inline">
                          {a.stars}
                          <Star />
                        </span>
                      </span>
                    </th>
                    <td className="num stars col-stars">
                      {a.stars}
                      <Star />
                    </td>
                    <td className="num">
                      {fmt.format(a.xp)}
                      {a.shortPathXp !== null && (
                        <span className="adv-route">long route · short {fmt.format(a.shortPathXp)}</span>
                      )}
                    </td>
                    {MULTIPLIERS.map((m) => (
                      <td key={m} className={`num runs${isBest(runs[m], m) ? ' is-best' : ''}`}>
                        {done ? '—' : fmt.format(runs[m])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="source">
          XP values from the{' '}
          <a href="https://wiki.leagueoflegends.com/en-us/LoR:Adventures" target="_blank" rel="noreferrer">
            Legends of Runeterra wiki
          </a>
          . Adventures with two routes use the longer route; take it to match these counts. Each run's XP is the adventure's
          XP times the multiplier.
        </p>
      </section>
    </main>
  )
}
