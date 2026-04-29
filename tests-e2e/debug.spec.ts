import { test } from '@playwright/test'

test('capturer erreur Supabase 400', async ({ page }) => {
  page.on('response', async resp => {
    if (resp.status() === 400 && resp.url().includes('supabase')) {
      try {
        const body = await resp.text()
        console.log(`[HTTP 400] ${resp.url()}`)
        console.log(`[BODY] ${body}`)
      } catch { /* ignore */ }
    }
  })

  await page.goto('/login')
  await page.fill('input[type="email"]', 'houssem@khedhiri.me')
  await page.fill('input[type="password"]', 'Khedhiri2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForTimeout(3000)
})
