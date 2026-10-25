import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { clearFinanceData, selectFinance } from './finance-helpers'
import { freshBoard } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await freshBoard(page)
  await clearFinanceData(page)
  await selectFinance(page)
})

test('finance navigation supports tab keyboard controls and accessible empty states', async ({ page }) => {
  await expectNoViolations(page)
  const workspaceTab = page.getByRole('tab', { name: 'Personal Finance' })
  await page.getByRole('tab', { name: 'Task Board' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(workspaceTab).toBeFocused()
  await expect(workspaceTab).toHaveAttribute('aria-selected', 'true')

  const overviewTab = page.getByRole('tab', { name: 'Overview' })
  await overviewTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Transactions' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
})

for (const width of [320, 1280]) {
  test(`finance controls fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('tab', { name: 'Accounts' }).click()
    await expectNoViolations(page)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox()
      expect(box && box.width >= 44 && box.height >= 44, await button.innerText()).toBeTruthy()
    }
  })
}

test('finance workspace makes no external network requests', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol.startsWith('http')) {
      external.push(request.url())
    }
  })
  await page.reload()
  await selectFinance(page)
  await page.getByRole('tab', { name: 'Reports' }).click()
  expect(external).toEqual([])
})
