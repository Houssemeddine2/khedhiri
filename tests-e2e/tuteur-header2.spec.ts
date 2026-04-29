import { test } from '@playwright/test'

test('inspect header gradient', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'sandra@khedhiri.me')
  await page.fill('input[type="password"]', 'Sandra2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 })
  await page.goto('http://localhost:3000/tuteur')
  await page.waitForTimeout(2000)

  const info = await page.evaluate(() => {
    // Find the gradient header by its inline style
    const gradDiv = Array.from(document.querySelectorAll('*')).find(el => {
      const s = (el as HTMLElement).getAttribute('style')
      return s && s.includes('linear-gradient')
    }) as HTMLElement | null
    
    // Find "Professeur Sid Ahmed" text
    const allText = Array.from(document.querySelectorAll('p')).filter(p => p.textContent?.includes('Professeur Sid Ahmed'))
    
    // Find the chat root (parent of gradient div)
    const chatRoot = gradDiv?.parentElement

    return {
      gradDiv: gradDiv ? { tag: gradDiv.tagName, rect: gradDiv.getBoundingClientRect(), style: gradDiv.getAttribute('style') } : null,
      chatRoot: chatRoot ? { tag: chatRoot.tagName, class: chatRoot.className, rect: chatRoot.getBoundingClientRect(), style: chatRoot.getAttribute('style') } : null,
      profText: allText.map(p => ({ text: p.textContent, rect: p.getBoundingClientRect() })),
    }
  })
  console.log(JSON.stringify(info, null, 2))
})
