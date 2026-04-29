import { test, expect, devices } from '@playwright/test'

const iPhone = devices['iPhone 14']
const BASE = 'https://www.khedhiri.me'

async function loginAs(page: ReturnType<typeof test.info> extends never ? never : Parameters<Parameters<typeof test>[1]>[0]['page'], email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/$/, { timeout: 15000 })
}

test.describe('Mobile — chat', () => {
  test('page chat : nav masquée, bouton Retour visible, boutons appel présents', async ({ browser }) => {
    const ctx = await browser.newContext({ ...iPhone })
    const page = await ctx.newPage()

    await loginAs(page, 'houssem@khedhiri.me', 'Sandra1411!')

    // Naviguer vers chat sarah
    await page.goto(`${BASE}/chats/617eff77-47ed-40e0-b784-c027183c9bee`, { waitUntil: 'networkidle', timeout: 20000 })

    // BottomTabBar cachée (retourne null sur /chats/)
    await expect(page.locator('nav[aria-label="Navigation principale"]')).not.toBeVisible()

    // Bouton Retour visible
    const retour = page.locator('a[aria-label="Retour à l\'accueil"]')
    await expect(retour).toBeVisible()

    // Boutons appel
    await expect(page.locator('button[aria-label*="Appeler"]')).toBeVisible()
    await expect(page.locator('button[aria-label*="Appel vidéo"]')).toBeVisible()

    // Bouton envoyer accessible (pas caché)
    await expect(page.locator('button[aria-label="Envoyer"]')).toBeVisible()

    await page.screenshot({ path: 'tests-e2e/screenshots/chat-mobile.png' })
    await ctx.close()
  })
})

test.describe('Mobile — accueil', () => {
  test('accueil : nav visible, ChatFab présent', async ({ browser }) => {
    const ctx = await browser.newContext({ ...iPhone })
    const page = await ctx.newPage()

    await loginAs(page, 'sarah@khedhiri.me', 'roSSette1412')

    await expect(page.locator('nav[aria-label="Navigation principale"]')).toBeVisible()
    await expect(page.locator('button[aria-label="Ouvrir un chat"]')).toBeVisible()

    await page.screenshot({ path: 'tests-e2e/screenshots/accueil-mobile.png' })
    await ctx.close()
  })
})

test.describe('Atelier — coin souvenir', () => {
  test('page atelier chargée sans erreur, onglet Coin souvenir accessible', async ({ browser }) => {
    const ctx = await browser.newContext({ ...iPhone })
    const page = await ctx.newPage()

    await loginAs(page, 'sarah@khedhiri.me', 'roSSette1412')
    await page.goto(`${BASE}/atelier`, { waitUntil: 'networkidle', timeout: 20000 })

    // Pas d'erreur visible
    await expect(page.locator('text=Could not find')).not.toBeVisible()
    await expect(page.locator('text=Error')).not.toBeVisible()

    // Onglet Coin souvenir
    const ongletSouvenir = page.locator('button', { hasText: 'Coin souvenir' })
    await expect(ongletSouvenir).toBeVisible()
    await ongletSouvenir.click()

    // Section galerie chargée
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Could not find')).not.toBeVisible()

    await page.screenshot({ path: 'tests-e2e/screenshots/atelier-coin-souvenir.png' })
    await ctx.close()
  })
})

test.describe('Appels — UI', () => {
  test('bouton appel vocal présent et cliquable sur page chat desktop', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    await loginAs(page, 'houssem@khedhiri.me', 'Sandra1411!')
    await page.goto(`${BASE}/chats/617eff77-47ed-40e0-b784-c027183c9bee`, { waitUntil: 'networkidle', timeout: 20000 })

    const callBtn = page.locator('button[aria-label*="Appeler"]').first()
    await expect(callBtn).toBeVisible()
    await expect(callBtn).toBeEnabled()

    await page.screenshot({ path: 'tests-e2e/screenshots/chat-appel-btn.png' })
    await ctx.close()
  })
})
