import { test } from '@playwright/test'

test('screenshot tuteur sandra', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'sandra@khedhiri.me')
  await page.fill('input[type="password"]', 'Sandra2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.goto('http://localhost:3000/tuteur')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'tests-e2e/screenshots/tuteur-sandra-chat.png', fullPage: false })
})
