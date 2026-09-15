// Playwright playtest harness — "play like a 7-year-old".
// Boots the vite dev server, drives every revamped game through a full
// session on desktop + tablet viewports using the same hit areas a child
// would tap (real pointer events / real buttons), and screenshots every
// major state. Addictive detail: derives correct answers from window.__qa
// (dev-only) instead of bypassing game logic.
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = resolve(ROOT, 'qa/screenshots')
mkdirSync(SHOTS, { recursive: true })

const GAMES = [
  { id: 'targetblast', canvas: true, pointer: 'pointerdown' },
  { id: 'troopmarch', canvas: true, pointer: 'pointerdown' },
  { id: 'jetfighter', canvas: true, pointer: 'mousedown' },
  { id: 'rocketlaunch', canvas: false },
  { id: 'racerwords', canvas: false },
  { id: 'treasuremap', canvas: false },
]

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
]

const ONLY = process.argv[2] ? process.argv[2].split(',') : null
const results = []
const consoleErrors = []

async function pollQa(page, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const qa = await page.evaluate(() => window.__qa ?? null)
    if (qa) return qa
    await page.waitForTimeout(200)
  }
  return null
}

async function answerOnce(page, game, vp) {
  // Always act on FRESH state: re-poll before every attempt so a transition
  // (answered window, move phase, cinematic) never leaves us clicking stale
  // targets like a wedged robot.
  for (let attempt = 0; attempt < 24; attempt++) {
    const qa = await page.evaluate(() => window.__qa ?? null)
    if (!qa) { await page.waitForTimeout(250); continue }
    if (qa.phase === 'done') return { done: true }
    if (qa.phase === 'cinematic' || qa.phase === 'briefing') { await page.waitForTimeout(300); continue }

    if (qa.phase === 'move') {
      const dir = qa.bestMove ?? 'right'
      const btn = page.locator(`[data-qa="${dir}"]`)
      if (await btn.count()) { await btn.click(); return { done: false } }
      await page.waitForTimeout(250)
      continue
    }

    if (game.canvas) {
      if (!qa.point) { await page.waitForTimeout(250); continue }
      const box = await page.locator('canvas').boundingBox()
      if (!box) { await page.waitForTimeout(250); continue }
      await page.mouse.click(box.x + qa.point.x, box.y + qa.point.y)
      return { done: false }
    }

    const r = await page.evaluate((word) => {
      const btn = [...document.querySelectorAll('button')].find(
        b => !b.disabled && (b.textContent || '').trim() === word,
      )
      if (btn) { btn.click(); return 'clicked' }
      return 'missing'
    }, qa.word)
    if (r === 'clicked') return { done: false }
    await page.waitForTimeout(250)
  }
  throw new Error(`${game.id}: could not complete round (stale state)`)
}

async function playGame(vite, browser, game, vp, url) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await context.newPage()
  const errors = []
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text())
    if (process.env.QA_DEBUG) console.error('[page]', m.type(), m.text().slice(0, 200))
  })
  page.on('pageerror', e => errors.push(String(e)))

  const tag = `${game.id}-${vp.name}`
  const shot = (name) => page.screenshot({ path: resolve(SHOTS, `${tag}-${name}.png`) })
  const report = { game: game.id, viewport: vp.name, answers: 0, shieldsLost: 'n/a', sessionMs: 0, errors: [], xpBefore: null, xpAfter: null, touchTargets: [], screenshots: [], verdict: '' }

  const t0 = Date.now()
  await page.addInitScript(() => { delete window.__qa })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await shot('01-briefing')
  report.screenshots.push('01-briefing')

  // XP before
  report.xpBefore = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('gamifyschool_stats') || '{}')
    return s.xp ?? null
  })

  // press START on the briefing
  const started = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
    const start = buttons.find(b => /start|take off|set sail|begin|recruit|engine/i.test(b.textContent || ''))
    if (start) { start.click(); return true }
    return false
  })
  if (!started) throw new Error(`${game.id}: no briefing start button`)

  // play until done (safety-capped)
  let midShot = false
  let bossShot = false
  const deadline = Date.now() + 150000
  while (Date.now() < deadline) {
    const res = await answerOnce(page, game, vp)
    if (res.done) break
    report.answers++
    if (!midShot && report.answers >= 2) { await shot('02-midgame'); report.screenshots.push('02-midgame'); midShot = true }
    const qaNow = await page.evaluate(() => window.__qa ?? null)
    if (!bossShot && qaNow?.phase === 'boss') {
      await page.waitForTimeout(900)
      await shot('03-boss')
      report.screenshots.push('03-boss')
      bossShot = true
    }
  }
  report.sessionMs = Date.now() - t0

  // let the victory ceremony play out before the final shot
  await page.waitForTimeout(3400)
  await shot('04-end')
  report.screenshots.push('04-end')

  report.xpAfter = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('gamifyschool_stats') || '{}')
    return s.xp ?? null
  })

  // touch-target audit on the last visible interactive elements
  report.touchTargets = await page.evaluate(() => {
    return [...document.querySelectorAll('button')]
      .filter(b => b.offsetParent !== null)
      .map(b => {
        const r = b.getBoundingClientRect()
        return { label: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 24) || 'icon', w: Math.round(r.width), h: Math.round(r.height) }
      })
      .filter(t => t.w > 0)
  })

  report.errors = errors
  await context.close()
  return report
}

// ------------------------------------------------------------------ run

const vite = await createServer({
  root: ROOT,
  server: { port: 5199, strictPort: true },
  logLevel: 'silent',
})
await vite.listen()

console.log('vite dev server up on :5199')
const browser = await chromium.launch()

// dashboard smoke (shared chrome changed too)
if (!ONLY || ONLY.includes('dashboard')) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto('http://localhost:5199/gamifyschool/#/english', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: resolve(SHOTS, 'dashboard-desktop.png') })
  results.push({ game: 'dashboard', viewport: 'desktop', answers: 0, sessionMs: 0, errors, xpBefore: null, xpAfter: null, touchTargets: [], screenshots: ['dashboard-desktop.png'], verdict: '' })
  await context.close()
}

for (const vp of VIEWPORTS) {
  for (const game of GAMES) {
    if (ONLY && !ONLY.includes(game.id)) continue
    console.log(`playing ${game.id} @ ${vp.name}…`)
    try {
      results.push(await playGame(vite, browser, game, vp, `http://localhost:5199/gamifyschool/#/english/play/0/${game.id}`))
    } catch (e) {
      results.push({ game: game.id, viewport: vp.name, answers: 0, sessionMs: 0, errors: [String(e)], xpBefore: null, xpAfter: null, touchTargets: [], screenshots: [], verdict: 'FAIL — crashed harness' })
    }
  }
}

await browser.close()
await vite.close()

// ------------------------------------------------------------------ report
let fail = 0
console.log('\n===== QA RESULTS =====')
for (const r of results) {
  const xpGain = r.xpBefore != null && r.xpAfter != null ? r.xpAfter - r.xpBefore : null
  const smallTargets = r.touchTargets.filter(t => t.w < 44 || t.h < 44)
  const ok = r.errors.length === 0 && (r.game === 'dashboard' || (r.answers >= 5 && (xpGain === null || xpGain >= 10)))
  if (!ok) fail++
  r.verdict = ok ? 'PASS' : 'FAIL'
  console.log(`${ok ? '✅' : '❌'} ${r.game} @ ${r.viewport}: answers=${r.answers} xp=${xpGain ?? '-'} errors=${r.errors.length} smallTargets=${smallTargets.length} ${Math.round(r.sessionMs / 1000)}s`)
  if (r.errors.length) console.log('   errors:', r.errors.slice(0, 3))
  if (smallTargets.length) console.log('   small targets:', JSON.stringify(smallTargets.slice(0, 5)))
}

writeFileSync(resolve(ROOT, 'qa/qa-results.json'), JSON.stringify(results, null, 2))
console.log(`\n${fail === 0 ? 'ALL GREEN' : fail + ' FAILURES'} — results in qa/qa-results.json, screenshots in qa/screenshots/`)
process.exit(fail === 0 ? 0 : 1)
