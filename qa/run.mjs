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

async function answerOnce(page, game) {
  // Single-shot attempt on FRESH state — the main loop owns cadence and the
  // progress watchdog. Never retries with a stale snapshot.
  const qa = await page.evaluate(() => window.__qa ?? null)
  if (!qa) return { done: false, progress: false }
  if (qa.phase === 'done') return { done: true, progress: true }
  if (qa.phase === 'cinematic' || qa.phase === 'briefing') return { done: false, progress: true }

  if (qa.phase === 'move') {
    const dir = qa.bestMove ?? 'right'
    const btn = page.locator(`[data-qa="${dir}"]`)
    if (await btn.count()) { await btn.click(); return { done: false, progress: true } }
    return { done: false, progress: false }
  }

  if (game.canvas) {
    if (!qa.point) return { done: false, progress: false }
    const box = await page.locator('canvas').boundingBox()
    if (!box) return { done: false, progress: false }
    await page.mouse.click(box.x + qa.point.x, box.y + qa.point.y)
    return { done: false, progress: true }
  }

  const r = await page.evaluate((word) => {
    const btn = [...document.querySelectorAll('button')].find(
      b => !b.disabled && (b.textContent || '').trim() === word,
    )
    if (btn) { btn.click(); return 'clicked' }
    return 'missing'
  }, qa.word)
  return { done: false, progress: r === 'clicked' }
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

  // play until done (safety-capped + progress watchdog)
  let midShot = false
  let bossShot = false
  let lastState = ''
  let staleCalls = 0
  const deadline = Date.now() + 150000
  while (Date.now() < deadline) {
    const res = await answerOnce(page, game)
    if (res.done) break
    const qaNow = await page.evaluate(() => window.__qa ?? null)
    const state = qaNow ? `${qaNow.phase}:${qaNow.word ?? ''}:${qaNow.bestMove ?? ''}` : 'null'
    if (state === lastState && !res.progress) staleCalls++
    else { staleCalls = 0; lastState = state }
    if (staleCalls > 60) {
      const dump = await page.evaluate(() => ({
        qa: window.__qa ?? null,
        buttons: [...document.querySelectorAll('button')].map(b => ({ t: (b.textContent || '').trim(), d: b.disabled })),
        url: location.href,
      }))
      throw new Error(`${game.id}: no progress for 30s — ${JSON.stringify(dump).slice(0, 600)}`)
    }
    if (res.progress && !qaNow?.word?.length || (res.progress && qaNow?.phase === 'playing')) report.answers++
    if (report.answers >= 2 && !midShot) { await shot('02-midgame'); report.screenshots.push('02-midgame'); midShot = true }
    if (!bossShot && qaNow?.phase === 'boss') {
      await page.waitForTimeout(900)
      await shot('03-boss')
      report.screenshots.push('03-boss')
      bossShot = true
    }
    await page.waitForTimeout(400)
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
