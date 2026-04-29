import { test } from '@playwright/test'

test('inspect header content', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'sandra@khedhiri.me')
  await page.fill('input[type="password"]', 'Sandra2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.goto('http://localhost:3000/tuteur')
  await page.waitForTimeout(2000)

  const info = await page.evaluate(() => {
    const header = document.querySelector('.flex.flex-col .flex-shrink-0') as HTMLElement | null
    const avatar = header?.querySelector('.font-fraunces.font-bold.text-white') as HTMLElement | null
    const name = header?.querySelectorAll('.font-fraunces.font-bold')
    const rect = header?.getBoundingClientRect()
    return {
      headerH: header?.offsetHeight,
      headerBg: header ? getComputedStyle(header).background : null,
      headerRect: rect ? { x: rect.x, y: rect.y, w: rect.width } : null,
      avatarText: avatar?.textContent,
      nameElements: name ? Array.from(name).map(n => ({ text: n.textContent, x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y })) : [],
    }
  })
  console.log(JSON.stringify(info, null, 2))
})
