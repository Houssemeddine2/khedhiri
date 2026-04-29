import { test } from '@playwright/test'

test('screenshot tuteur page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'houssem@khedhiri.me')
  await page.fill('input[type="password"]', 'Khedhiri2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.goto('http://localhost:3000/tuteur')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'tests-e2e/screenshots/tuteur-sandra.png', fullPage: false })
  
  const info = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.querySelector('.flex.flex-col') as HTMLElement | null
    const topDiv = document.querySelector('[style*="calc(100vh"]') as HTMLElement | null
    return {
      topDiv: topDiv ? { h: topDiv.offsetHeight, style: topDiv.getAttribute('style'), class: topDiv.className } : null,
      bodyH: document.body.offsetHeight,
      viewH: window.innerHeight,
    }
  })
  console.log(JSON.stringify(info, null, 2))
})
