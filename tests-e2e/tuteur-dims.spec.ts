import { test } from '@playwright/test'

test('tuteur chat dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'sandra@khedhiri.me')
  await page.fill('input[type="password"]', 'Sandra2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.goto('http://localhost:3000/tuteur')
  await page.waitForTimeout(2000)

  const info = await page.evaluate(() => {
    const chatRoot = document.querySelector('[style*="calc(100vh - 56px)"]') as HTMLElement | null
    const header = chatRoot?.firstElementChild as HTMLElement | null
    const msgsArea = chatRoot?.children[1] as HTMLElement | null
    const inputBar = chatRoot?.lastElementChild as HTMLElement | null
    const aside = document.querySelector('aside') as HTMLElement | null

    return {
      aside: aside ? { x: aside.getBoundingClientRect().right } : null,
      chatRoot: chatRoot ? { x: chatRoot.getBoundingClientRect().left, w: chatRoot.offsetWidth, h: chatRoot.offsetHeight } : null,
      header: header ? { x: header.getBoundingClientRect().left, y: header.getBoundingClientRect().top, h: header.offsetHeight } : null,
      msgsArea: msgsArea ? { h: msgsArea.offsetHeight } : null,
      inputBar: inputBar ? { y: inputBar.getBoundingClientRect().top, h: inputBar.offsetHeight } : null,
    }
  })
  console.log(JSON.stringify(info, null, 2))
})
