import { expect, test } from '@playwright/test'
import type { LocalWorkspace } from '../src/localWorkspace'

test('autosaves text in a local portfolio across reload', async ({ page }) => {
  const text = 'Folio QA'
  await page.goto('/')
  await page.getByRole('button', { name: /make your first portfolio/i }).click()
  await page.getByLabel('Name', { exact: true }).fill('Folio QA Tester')
  await page.getByLabel('Email', { exact: true }).fill('folio-qa@example.test')
  await page.getByRole('button', { name: /create local profile/i }).click()

  await page.getByRole('button', { name: /make a new portfolio/i }).click()
  await page.getByRole('button', { name: /^\+ Add/ }).click()
  await page.getByRole('button').filter({ has: page.getByText('A big point of view', { exact: true }) }).click()
  const block = page.locator('h1[data-block-editable]')
  await block.fill(text)
  await block.blur()

  // The saved indicator can still refer to an earlier edit during the debounce.
  await expect.poll(() => page.evaluate(async expectedText => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('folio-local-workspace', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    try {
      const workspace = await new Promise<LocalWorkspace | undefined>((resolve, reject) => {
        const request = database.transaction('workspace').objectStore('workspace').get('current')
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      const portfolio = workspace?.portfolios.find(item => item.id === workspace.activePortfolioId)
      return portfolio?.pages.some(item => item.blocks.some(block => block.content === expectedText)) ?? false
    } finally {
      database.close()
    }
  }, text), { message: 'wait for the edited text to reach local storage' }).toBe(true)

  await page.reload()
  await page.getByRole('button', { name: /open your portfolios/i }).click()
  await page.getByRole('button', { name: 'Open Untitled portfolio' }).click()
  await expect(page.getByRole('heading', { name: text, exact: true })).toBeVisible()
})
