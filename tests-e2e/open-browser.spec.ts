import { test } from '@playwright/test'

test('debug layout sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'houssem@khedhiri.me')
  await page.fill('input[type="password"]', 'Khedhiri2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.waitForTimeout(1500)

  const info = await page.evaluate(() => {
    const aside = document.querySelector('aside')
    const rootDiv = aside?.firstElementChild as HTMLElement | null
    const scrollDiv = rootDiv?.firstElementChild as HTMLElement | null
    const pinDiv = rootDiv?.lastElementChild as HTMLElement | null
    const logoutBtn = document.querySelector('button[aria-label="Se déconnecter"]') as HTMLElement | null

    return {
      aside: aside ? { h: aside.offsetHeight, scrollH: aside.scrollHeight, display: getComputedStyle(aside).display, overflow: getComputedStyle(aside).overflow } : null,
      rootDiv: rootDiv ? { h: rootDiv.offsetHeight, className: rootDiv.className } : null,
      scrollDiv: scrollDiv ? { h: scrollDiv.offsetHeight, scrollH: scrollDiv.scrollHeight, overflow: getComputedStyle(scrollDiv).overflowY } : null,
      pinDiv: pinDiv ? { h: pinDiv.offsetHeight, className: pinDiv.className } : null,
      logoutBtn: logoutBtn ? { exists: true, rect: logoutBtn.getBoundingClientRect() } : { exists: false },
    }
  })

  console.log(JSON.stringify(info, null, 2))
})
