import { test } from '@playwright/test'

test('check aside height', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'houssem@khedhiri.me')
  await page.fill('input[type="password"]', 'Khedhiri2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.waitForTimeout(1500)

  const info = await page.evaluate(() => {
    const aside = document.querySelector('aside') as HTMLElement | null
    const style = aside ? getComputedStyle(aside) : null
    return {
      asideH: aside?.offsetHeight,
      asideScrollH: aside?.scrollHeight,
      asideHeight: style?.height,
      asideOverflow: style?.overflow,
      asideDisplay: style?.display,
      viewportH: window.innerHeight,
    }
  })

  console.log(JSON.stringify(info, null, 2))
})
