import { test } from '@playwright/test'

test('tuteur dom structure', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'sandra@khedhiri.me')
  await page.fill('input[type="password"]', 'Sandra2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.goto('http://localhost:3000/tuteur')
  await page.waitForTimeout(2000)

  const info = await page.evaluate(() => {
    // Find the element that contains "Nouvelle session"
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Nouvelle session'))
    const parent1 = btn?.parentElement
    const parent2 = parent1?.parentElement
    const parent3 = parent2?.parentElement
    
    return {
      btn: btn ? { text: btn.textContent, y: btn.getBoundingClientRect().top } : null,
      parent1: parent1 ? { tag: parent1.tagName, class: parent1.className, h: parent1.offsetHeight, y: parent1.getBoundingClientRect().top } : null,
      parent2: parent2 ? { tag: parent2.tagName, class: parent2.className, h: parent2.offsetHeight } : null,
      parent3: parent3 ? { tag: parent3.tagName, class: parent3.className, h: parent3.offsetHeight, style: parent3.getAttribute('style') } : null,
    }
  })
  console.log(JSON.stringify(info, null, 2))
})
