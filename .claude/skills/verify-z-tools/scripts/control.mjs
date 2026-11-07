#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, openSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const RUN = process.env.VERIFY_RUN || 'default'
const RUN_DIR = join(ROOT, '.verify/runs', RUN)
const STATE = join(RUN_DIR, 'state.json')
const ARTIFACTS = join(ROOT, 'verify-artifacts', RUN)
const CHROME =
  process.env.CHROME ||
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const die = (msg) => {
  console.error(`verify-z-tools: ${msg}`)
  process.exit(1)
}

function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) out[key] = true
      else out[key] = argv[++i]
    } else out._.push(argv[i])
  }
  return out
}

const readState = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : null)
const writeState = (s) => writeFileSync(STATE, JSON.stringify(s, null, 2))
const alive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function freePort() {
  return new Promise((res, rej) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => res(port))
    })
    srv.on('error', rej)
  })
}

async function waitFor(check, what, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if (await check()) return
    } catch {}
    await sleep(250)
  }
  die(`timed out waiting for ${what}`)
}

function detached(cmd, args, logName) {
  const log = openSync(join(RUN_DIR, logName), 'a')
  const child = spawn(cmd, args, { cwd: ROOT, detached: true, stdio: ['ignore', log, log] })
  child.unref()
  return child.pid
}

async function launch(opts) {
  const prior = readState()
  if (prior && (alive(prior.previewPid) || alive(prior.chromePid)))
    die(`run "${RUN}" is already live (preview pid ${prior.previewPid}, chrome pid ${prior.chromePid}). Run cleanup or pick another VERIFY_RUN.`)
  if (!CHROME) die('no Chrome found; set CHROME=/path/to/chrome')
  rmSync(RUN_DIR, { recursive: true, force: true })
  mkdirSync(RUN_DIR, { recursive: true })
  mkdirSync(ARTIFACTS, { recursive: true })

  const outDir = join(RUN_DIR, 'dist')
  const rev = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim()
  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT }).toString().trim() !== ''
  console.log(`building ${rev}${dirty ? ' (dirty tree)' : ''} into ${outDir}`)
  execFileSync(join(ROOT, 'node_modules/.bin/tsc'), ['-b'], { cwd: ROOT, stdio: 'inherit' })
  execFileSync(join(ROOT, 'node_modules/.bin/vite'), ['build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  const port = await freePort()
  const cdpPort = await freePort()
  const previewPid = detached(
    join(ROOT, 'node_modules/.bin/vite'),
    ['preview', '--outDir', outDir, '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    'preview.log',
  )
  const chromePid = detached(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${join(RUN_DIR, 'chrome-profile')}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--window-size=1440,900',
      'about:blank',
    ],
    'chrome.log',
  )
  const state = { run: RUN, rev, dirty, port, cdpPort, previewPid, chromePid, outDir, viewport: opts.width ? [Number(opts.width), Number(opts.height || 844)] : null, startedAt: new Date().toISOString() }
  writeState(state)

  const base = `http://127.0.0.1:${port}`
  await waitFor(async () => (await (await fetch(`${base}/lor/xp`)).text()).includes('<title>z-tools</title>'), `preview at ${base}`)
  await waitFor(async () => (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).ok, `Chrome DevTools on ${cdpPort}`)
  await goto({ _: ['/'] }, true)
  console.log(`READY ${base} (run ${RUN}, chrome cdp ${cdpPort})`)
}

function portOwnerGroup(port) {
  try {
    const pid = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']).toString().trim().split('\n')[0]
    return Number(execFileSync('ps', ['-o', 'pgid=', '-p', pid]).toString().trim())
  } catch {
    return null
  }
}

async function doctor() {
  const s = readState()
  if (!s) die(`no state for run "${RUN}"; launch first`)
  const checks = []
  const check = (name, ok, detail = '') => checks.push({ name, ok, detail })
  check('preview process alive', alive(s.previewPid), `pid ${s.previewPid}`)
  check('chrome process alive', alive(s.chromePid), `pid ${s.chromePid}`)
  check('preview port owned by this run', portOwnerGroup(s.port) === s.previewPid, `port ${s.port}`)
  check('cdp port owned by this run', portOwnerGroup(s.cdpPort) === s.chromePid, `port ${s.cdpPort}`)
  try {
    const served = await (await fetch(`http://127.0.0.1:${s.port}/lor/xp`)).text()
    const built = readFileSync(join(s.outDir, 'index.html'), 'utf8')
    const asset = (html) => html.match(/assets\/index-[^"]+\.js/)?.[0]
    check('deep link /lor/xp serves the app shell', served.includes('<title>z-tools</title>'))
    check('served bundle is this run\'s build', asset(served) === asset(built), asset(served) ?? 'no bundle')
  } catch (e) {
    check('preview responds', false, String(e))
  }
  const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim()
  check('build matches git HEAD', head === s.rev, `built ${s.rev}${s.dirty ? ' dirty' : ''}, HEAD ${head}`)
  for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ` (${c.detail})` : ''}`)
  console.log(`url http://127.0.0.1:${s.port}  run ${RUN}  artifacts ${ARTIFACTS}`)
  if (checks.some((c) => !c.ok)) process.exit(1)
}

async function connect() {
  const s = readState()
  if (!s || !alive(s.chromePid)) die(`run "${RUN}" has no live Chrome; launch first`)
  const list = await (await fetch(`http://127.0.0.1:${s.cdpPort}/json/list`)).json()
  let page = list.find((t) => t.type === 'page')
  if (!page) page = await (await fetch(`http://127.0.0.1:${s.cdpPort}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result)
    }
  }
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      pending.set(++id, { res, rej })
      ws.send(JSON.stringify({ id, method, params }))
    })
  const [w, h] = s.viewport ?? [1440, 900]
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 })
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result.value
  }
  return { s, send, evaluate, close: () => ws.close() }
}

const RESOLVE = String.raw`
(role, name, label) => {
  const norm = (t) => (t ?? '').replace(/\s+/g, ' ').trim()
  const labelOf = (el) => {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label')
    if (el.id) { const l = document.querySelector('label[for="' + el.id + '"]'); if (l) return l.textContent }
    const wrap = el.closest('label'); if (wrap) return wrap.querySelector('span')?.textContent ?? wrap.textContent
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const parts = []; while (w.nextNode()) parts.push(w.currentNode.nodeValue)
    return parts.join(' ')
  }
  const sel = { button: 'button,[role=button]', link: 'a[href]', textbox: 'input', combobox: 'select', row: 'tbody tr' }
  let els
  if (label) els = [...document.querySelectorAll('input,select')].filter((el) => norm(labelOf(el)) === label)
  else els = [...document.querySelectorAll(sel[role] ?? '*')].filter((el) => {
    const n = role === 'row' ? norm(el.querySelector('th')?.querySelector('a')?.textContent) : norm(labelOf(el))
    return n === name
  })
  els = els.filter((el) => el.getClientRects().length > 0)
  if (els.length === 0) return { error: 'no visible match' }
  if (els.length > 1 && !window.__allowFirst) return { error: els.length + ' visible matches; pass --nth' }
  return els
}`

async function find(c, opts) {
  const role = opts.role ?? null
  const name = opts.name ?? null
  const label = opts.label ?? null
  const nth = Number(opts.nth ?? 0)
  const expr = `(() => { window.__allowFirst = ${opts.nth !== undefined}; const r = (${RESOLVE})(${JSON.stringify(role)}, ${JSON.stringify(name)}, ${JSON.stringify(label)}); if (r.error) return r; const el = r[${nth}]; if (!el) return { error: 'no match at nth ${nth}' }; window.__target = el; el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, tag: el.tagName } })()`
  const hit = await c.evaluate(expr)
  if (hit.error) die(`${label ? `label "${label}"` : `${role} "${name}"`}: ${hit.error}`)
  return hit
}

async function mouseClick(c, { x, y }, clickCount = 1) {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount })
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount })
}

async function settle(c) {
  await c.evaluate('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
}

async function goto(opts, quiet = false) {
  const c = await connect()
  const path = opts._[0] ?? '/'
  await c.send('Page.enable')
  await c.send('Page.navigate', { url: `http://127.0.0.1:${c.s.port}${path}` })
  await waitFor(async () => (await c.evaluate('document.readyState')) === 'complete' && (await c.evaluate("!!document.querySelector('#content > *')")), `page ${path}`)
  await settle(c)
  if (!quiet) console.log(`at ${await c.evaluate('location.pathname + location.search')}`)
  c.close()
}

async function click(opts) {
  const c = await connect()
  const hit = await find(c, opts)
  await mouseClick(c, hit)
  await settle(c)
  console.log(`clicked ${opts.role} "${opts.name}" -> ${await c.evaluate('location.pathname + location.search')}`)
  c.close()
}

async function fill(opts) {
  if (opts.value === undefined) die('fill needs --value')
  const c = await connect()
  const hit = await find(c, opts)
  await mouseClick(c, hit)
  await c.evaluate('window.__target.select()')
  if (opts.value === '' || opts.value === true) {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
  } else await c.send('Input.insertText', { text: String(opts.value) })
  if (opts.commit) {
    await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  }
  await settle(c)
  const shown = await c.evaluate('window.__target.value')
  console.log(`filled "${opts.label}" with ${JSON.stringify(opts.value)}; field now shows ${JSON.stringify(shown)}`)
  c.close()
}

async function choose(opts) {
  if (!opts.label || opts.option === undefined) die('select needs --label and --option')
  const c = await connect()
  await find(c, opts)
  const r = await c.evaluate(`(() => { const s = window.__target; const o = [...s.options].find((o) => o.textContent.trim() === ${JSON.stringify(opts.option)}); if (!o) return { error: 'options: ' + [...s.options].map((o) => o.textContent.trim()).join(' | ') }; s.focus(); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, o.value); s.dispatchEvent(new Event('change', { bubbles: true })); return { ok: true } })()`)
  if (r.error) die(`no option "${opts.option}"; ${r.error}`)
  await settle(c)
  console.log(`selected "${opts.option}" in "${opts.label}"`)
  c.close()
}

const SNAPSHOT = String.raw`(() => {
  const t = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
  const words = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const p = []; while (w.nextNode()) p.push(w.currentNode.nodeValue); return p.join(' ').replace(/\s+/g, ' ').trim() }
  const q = (s, r = document) => r.querySelector(s)
  const qa = (s, r = document) => [...r.querySelectorAll(s)]
  const labelFor = (el) => t(q('label[for="' + el.id + '"]'))
  return {
    url: location.pathname + location.search,
    title: document.title,
    nav: qa('.spines a').map((a) => ({ text: words(a), href: a.getAttribute('href'), current: a.getAttribute('aria-current') === 'page' })),
    h1: t(q('h1')),
    banner: q('.banner') ? { title: t(q('.banner-title')), game: t(q('.banner-game')) } : null,
    shelf: qa('.shelf-item').map((a) => ({ text: words(a), href: a.getAttribute('href') })),
    inputs: qa('.inputs .field').map((f) => { const i = q('input', f); return { label: labelFor(i), value: i.value, disabled: i.disabled, cap: t(q('.xp-cap', f)) || null, hint: t(q('.hint', f)), warn: !!q('.hint.is-warn', f) } }),
    totals: qa('.totals > div').map((d) => ({ label: t(q('dt', d)), value: t(q('dd', d)) })),
    fewestRuns: qa('.best-cell').map((c) => ({ multiplier: t(q('.best-mult', c)), runs: t(q('.best-runs', c)), adventure: t(q('.best-name', c)), meta: t(q('.best-meta', c)) })),
    emptyMessages: qa('.empty').map(t),
    campaigns: qa('.chip').map((b) => ({ name: t(b), on: b.getAttribute('aria-pressed') === 'true' })),
    difficulty: q('.select select') ? q('.select select').selectedOptions[0]?.textContent.trim() : null,
    sort: qa('.table thead th[aria-sort]').filter((th) => th.getAttribute('aria-sort') !== 'none').map((th) => t(th) + ' ' + th.getAttribute('aria-sort')),
    columns: qa('.table thead th').map(t),
    rows: qa('.table tbody tr').map((tr) => {
      const cells = qa('td', tr)
      return {
        adventure: t(q('.adv-name', tr)), wiki: q('.adv-name', tr)?.getAttribute('href'), campaign: t(q('.adv-campaign-name', tr)),
        stars: t(cells[0]), xp: (cells[1]?.firstChild?.textContent ?? '').trim(), route: t(q('.adv-route', tr)) || null,
        runs: cells.slice(2).map((td) => t(td) + (td.classList.contains('is-best') ? '*' : '')),
      }
    }),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
})()`

async function snapshot(opts) {
  const c = await connect()
  const snap = await c.evaluate(SNAPSHOT)
  const out = JSON.stringify(snap, null, 2)
  if (opts.path) {
    const p = resolve(ARTIFACTS, opts.path)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, out)
    console.log(`snapshot -> ${p}`)
  }
  if (!opts.path || opts.print) console.log(out)
  c.close()
}

async function screenshot(opts) {
  if (!opts.path) die('screenshot needs --path')
  const c = await connect()
  const params = { format: 'png' }
  if (opts.top) {
    await c.evaluate('window.scrollTo(0, 0)')
    await settle(c)
  }
  if (opts.full) {
    const { cssContentSize } = await c.send('Page.getLayoutMetrics')
    params.captureBeyondViewport = true
    params.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 }
  }
  const { data } = await c.send('Page.captureScreenshot', params)
  const p = resolve(ARTIFACTS, opts.path)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, Buffer.from(data, 'base64'))
  console.log(`screenshot -> ${p}`)
  c.close()
}

function viewport(opts) {
  const s = readState() ?? die('launch first')
  s.viewport = opts._[0] === 'desktop' ? null : [Number(opts._[0]), Number(opts._[1] ?? 844)]
  writeState(s)
  console.log(`viewport ${s.viewport ? s.viewport.join('x') : '1440x900'} (applies to the next command)`)
}

async function evalCmd(opts) {
  const c = await connect()
  console.log(JSON.stringify(await c.evaluate(opts._.join(' ')), null, 2))
  c.close()
}

async function cleanup() {
  const s = readState()
  if (!s) {
    console.log(`nothing to clean for run "${RUN}"`)
    return
  }
  for (const [name, pid] of [['preview', s.previewPid], ['chrome', s.chromePid]]) {
    if (!alive(pid)) continue
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {}
    for (let i = 0; i < 20 && alive(pid); i++) await sleep(100)
    if (alive(pid)) {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch {}
    }
    console.log(`stopped ${name} (process group ${pid})`)
  }
  mkdirSync(join(ARTIFACTS, 'logs'), { recursive: true })
  for (const log of ['preview.log', 'chrome.log']) if (existsSync(join(RUN_DIR, log))) cpSync(join(RUN_DIR, log), join(ARTIFACTS, 'logs', log))
  rmSync(RUN_DIR, { recursive: true, force: true })
  console.log(`removed ${RUN_DIR}; evidence kept in ${ARTIFACTS}`)
}

const [cmd, ...rest] = process.argv.slice(2)
const opts = parseArgs(rest)
const commands = { launch, doctor, goto, click, fill, select: choose, snapshot, screenshot, viewport, eval: evalCmd, cleanup }
if (!commands[cmd]) {
  console.log('usage: control.mjs <launch|doctor|goto|click|fill|select|snapshot|screenshot|viewport|eval|cleanup> [options]')
  process.exit(cmd ? 1 : 0)
}
await commands[cmd](opts)
