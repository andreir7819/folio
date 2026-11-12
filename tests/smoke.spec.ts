import { expect, test } from '@playwright/test'

test('opens Folio and starts the local portfolio flow', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /your work deserves/i })).toBeVisible()
  await page.getByRole('button', { name: /make your first portfolio/i }).click()

  await expect(page.getByRole('heading', { name: /make your creative corner/i })).toBeVisible()
})
