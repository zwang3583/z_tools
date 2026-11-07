import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const API = 'https://wiki.leagueoflegends.com/en-us/api.php'
const WIKI = 'https://wiki.leagueoflegends.com/en-us/'
const LEVEL_PAGE = 'Template:PoCChampionLevel'
const CAMPAIGN_PAGES = [
  ['world', 'LoR:World_Adventures'],
  ['nightmare', 'LoR:Nightmare_Adventures'],
  ['legends-of-arcane', 'LoR:Legends_of_Arcane'],
  ['titans-of-runeterra', 'LoR:Titans_of_Runeterra'],
  ['rogues-of-runeterra', 'LoR:Rogues_of_Runeterra'],
  ['spirit-blossom', 'LoR:Spirit_Blossom_(Campaign)'],
  ['teamfight-adventures', 'LoR:Teamfight_Adventures'],
]
const dataDir = fileURLToPath(new URL('../src/tools/lor-xp/data/', import.meta.url))

function fail(message) {
  console.error(`sync-lor-wiki: ${message}`)
  process.exit(1)
}

async function fetchWikitext(page) {
  const url = `${API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`
  const res = await fetch(url, { headers: { 'User-Agent': 'z-tools-lor-xp-sync/1.0 (https://github.com/zwang/z_tools)' } })
  if (!res.ok) fail(`${page}: HTTP ${res.status}`)
  const body = await res.json()
  if (body.error) fail(`${page}: ${body.error.code} ${body.error.info}`)
  const text = body.parse?.wikitext
  if (typeof text !== 'string' || text.length === 0) fail(`${page}: response has no wikitext`)
  return text
}

function templateBlocks(text, name) {
  const blocks = []
  const opener = `{{${name}|`
  let start = text.indexOf(opener)
  while (start !== -1) {
    let depth = 0
    let i = start
    for (; i < text.length; i++) {
      if (text.startsWith('{{', i)) { depth++; i++ }
      else if (text.startsWith('}}', i)) { depth--; i++; if (depth === 0) break }
    }
    if (depth !== 0) fail(`unterminated {{${name}}} at offset ${start}`)
    blocks.push(text.slice(start, i + 1))
    start = text.indexOf(opener, i + 1)
  }
  return blocks
}

function param(block, key, where) {
  const matches = [...block.matchAll(new RegExp(`^\\s*\\|${key}=(.*)$`, 'gm'))]
  if (matches.length !== 1) fail(`${where}: expected one |${key}=, found ${matches.length}`)
  return matches[0][1].replace(/<!--.*?-->/g, '').trim()
}

function parseInteger(raw, where) {
  const cleaned = raw.replace(/,/g, '').trim()
  if (!/^\d+$/.test(cleaned)) fail(`${where}: not an integer: ${JSON.stringify(raw)}`)
  return Number(cleaned)
}

function parseAdventure(block, campaign, page, index) {
  let where = `${page} row ${index + 1}`
  const id = param(block, 'id', where)
  where = `${page} row ${index + 1} (${id})`
  if (!/^[A-Za-z0-9]+$/.test(id)) fail(`${where}: unexpected id`)

  const links = [...param(block, 'title', where).matchAll(/\[\[(LoR:[^|\]]+)\|([^\]]+)\]\]/g)]
  const link = links.at(-1)
  if (!link) fail(`${where}: no [[LoR:...|Name]] link in |title=`)
  const pageTitle = link[1].trim()
  const name = link[2].trim()

  const starsRaw = param(block, 'stars', where)
  if (!/^\d+(\.5)?$/.test(starsRaw)) fail(`${where}: unexpected stars ${JSON.stringify(starsRaw)}`)

  const xpRaw = param(block, 'XP', where)
  const routes = xpRaw.split(/<br\s*\/?>\s*or\s*<br\s*\/?>/i).map((part) => parseInteger(part, `${where} XP`))
  if (routes.length > 2) fail(`${where}: more than two XP routes: ${JSON.stringify(xpRaw)}`)
  const xp = Math.max(...routes)
  if (xp <= 0 && Number(starsRaw) > 0) fail(`${where}: non-positive XP`)

  return {
    id,
    name,
    campaign,
    stars: Number(starsRaw),
    xp,
    shortPathXp: routes.length === 2 ? Math.min(...routes) : null,
    wikiUrl: WIKI + pageTitle.replace(/ /g, '_'),
  }
}

function parseLevels(text) {
  const rows = [...text.matchAll(/^\|\|?\s*(\d+)\s*\|\|\s*([\d,]+)\s*\|\|\s*([\d,]+)\s*$/gm)].map((m) => ({
    level: Number(m[1]),
    needed: parseInteger(m[2], `${LEVEL_PAGE} level ${m[1]}`),
    total: parseInteger(m[3], `${LEVEL_PAGE} level ${m[1]}`),
  }))
  if (rows.length < 2) fail(`${LEVEL_PAGE}: found only ${rows.length} level rows`)
  let sum = 0
  rows.forEach((row, i) => {
    if (row.level !== i + 1) fail(`${LEVEL_PAGE}: expected level ${i + 1}, found ${row.level}`)
    sum += row.needed
    if (sum !== row.total) fail(`${LEVEL_PAGE}: level ${row.level} cumulative ${sum} != Total EXP ${row.total}`)
  })
  if (rows[0].needed !== 0) fail(`${LEVEL_PAGE}: level 1 EXP needed should be 0`)
  return rows.slice(1).map((row) => row.needed)
}

const adventures = []
for (const [campaign, page] of CAMPAIGN_PAGES) {
  const blocks = templateBlocks(await fetchWikitext(page), 'PoC Adventure row')
  if (blocks.length === 0) fail(`${page}: no {{PoC Adventure row}} blocks`)
  blocks.forEach((block, i) => adventures.push(parseAdventure(block, campaign, page, i)))
}
const ids = new Set()
for (const a of adventures) {
  if (ids.has(a.id)) fail(`duplicate adventure id ${a.id}`)
  ids.add(a.id)
}

const xpToNext = parseLevels(await fetchWikitext(LEVEL_PAGE))

writeFileSync(dataDir + 'adventures.json', JSON.stringify(adventures, null, 2) + '\n')
writeFileSync(
  dataDir + 'levels.json',
  JSON.stringify({ source: WIKI + LEVEL_PAGE, xpToNext }, null, 2) + '\n',
)

console.log('campaign              stars     xp  short  name')
for (const a of adventures) {
  console.log(
    `${a.campaign.padEnd(21)} ${String(a.stars).padStart(5)} ${String(a.xp).padStart(6)} ${String(a.shortPathXp ?? '').padStart(6)}  ${a.name}`,
  )
}
const total = xpToNext.reduce((s, n) => s + n, 0)
console.log(`\n${adventures.length} adventures; max level ${xpToNext.length + 1}; total XP ${total}`)
