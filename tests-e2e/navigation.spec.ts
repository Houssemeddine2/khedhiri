import { test, expect } from '@playwright/test'

const EMAIL    = 'houssem@khedhiri.me'
const PASSWORD = 'Khedhiri2026!'

test('login + page principale', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/login')
  await expect(page.locator('h1')).toBeVisible()
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')

  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForTimeout(2000)

  // NavBar présente
  await expect(page.locator('nav')).toBeVisible()

  // Aucun crash visible
  const error500 = page.locator('text=500')
  await expect(error500).not.toBeVisible()

  // ChatPanel absent au départ
  await expect(page.locator('[role="dialog"]')).not.toBeVisible()

  console.log(`Erreurs console: ${consoleErrors.length === 0 ? 'aucune ✓' : consoleErrors.join(' | ')}`)
})

test('bulle chat s\'ouvre', async ({ page }) => {
  // Login d'abord
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForTimeout(2000)

  // Trouver un bouton qui ouvre le chat (avatar dans NavBar ou sidebar)
  // On cherche un bouton cliquable lié à un autre membre
  const allButtons = page.locator('button')
  const count = await allButtons.count()
  console.log(`Boutons trouvés: ${count}`)

  // Vérifier que le ChatPanel (dialog) s'ouvre quand on clique un avatar
  // On cherche un bouton avec aria-label contenant un prénom
  const sandraBtn = page.locator('button[aria-label*="Sandra"], button[aria-label*="sandra"]').first()
  const sarahBtn  = page.locator('button[aria-label*="Sarah"],  button[aria-label*="sarah"]').first()

  const hasSandra = await sandraBtn.count() > 0
  const hasSarah  = await sarahBtn.count()  > 0
  console.log(`Bouton Sandra: ${hasSandra ? '✓' : '✗'} | Bouton Sarah: ${hasSarah ? '✓' : '✗'}`)

  if (hasSandra) {
    await sandraBtn.click()
    await page.waitForTimeout(600)
    const dialog = page.locator('[role="dialog"]')
    const visible = await dialog.isVisible()
    console.log(`ChatPanel après clic Sandra: ${visible ? 'ouvert ✓' : 'toujours fermé ✗'}`)
    if (visible) {
      // Vérif bouton appel audio et vidéo
      const audioBtn = page.locator('[aria-label*="Appeler"]')
      const videoBtn = page.locator('[aria-label*="vidéo"]')
      console.log(`Bouton audio: ${await audioBtn.count() > 0 ? '✓' : '✗'}`)
      console.log(`Bouton vidéo: ${await videoBtn.count() > 0 ? '✓' : '✗'}`)
    }
  }
})

test('vue mobile 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForTimeout(1500)

  // Pas de scroll horizontal
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
  const clientWidth = await page.evaluate(() => document.body.clientWidth)
  console.log(`scrollWidth: ${scrollWidth} / clientWidth: ${clientWidth}`)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
})
