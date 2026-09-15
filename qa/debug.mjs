import { createServer } from 'vite'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const vite = await createServer({ root: ROOT, server: { port: 5199, strictPort: true }, logLevel: 'silent' })
await vite.listen()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('console', m => console.log('[console]', m.type(), m.text().slice(0, 200)))
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)))

for (const gameId of ['rocketlaunch', 'treasuremap', 'targetblast']) {
  console.log(`\n===== ${gameId} =====`)
  await page.goto(`http://localhost:5199/gamifyschool/#/english/play/0/${gameId}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
    const start = buttons.find(b => /start|take off|set sail|begin|recruit|engine/i.test(b.textContent || ''))
    if (start) { start.click(); return (start.textContent || '').trim() }
    return null
  })
  console.log('start button:', clicked)
  await page.waitForTimeout(1500)
  const state = await page.evaluate(() => ({
    qa: window.__qa ?? null,
    buttons: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(Boolean),
  }))
  console.log('qa:', JSON.stringify(state.qa))
  console.log('buttons:', JSON.stringify(state.buttons))
}
await browser.close()
await vite.close()
