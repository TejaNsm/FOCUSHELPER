import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { addTask, freshBoard } from './helpers'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => freshBoard(page))

test('axe: empty board', async ({ page }) => {
  await expectNoViolations(page)
})

test('axe: populated board with overdue task', async ({ page }) => {
  await addTask(page, 'tasks', { title: 'Pay rent', deadline: '2020-01-01', description: 'Monthly' })
  await addTask(page, 'meetings', { title: 'Standup' })
  await expectNoViolations(page)
})

test('axe: add, edit and delete dialogs', async ({ page }) => {
  await page.getByRole('button', { name: 'Add task to Tasks' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoViolations(page)
  await page.getByLabel('Title (required)').fill('Pay rent')
  await page.getByRole('button', { name: 'Add task' }).click()

  await page.getByRole('button', { name: 'Edit Pay rent' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoViolations(page)
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: 'Delete Pay rent' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expectNoViolations(page)
})

test('keyboard only: add, edit, delete with focus restored', async ({ page }) => {
  const add = page.getByRole('button', { name: 'Add task to Tasks' })
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Title (required)')).toBeFocused()
  await page.keyboard.type('Keyboard task')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Keyboard task' })).toBeVisible()

  const edit = page.getByRole('button', { name: 'Edit Keyboard task' })
  await edit.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await expect(edit).toBeFocused()

  await page.getByRole('button', { name: 'Delete Keyboard task' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Remove' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Keyboard task' })).toHaveCount(0)
  await expect(add).toBeFocused()
})

for (const width of [320, 1280]) {
  test(`no horizontal scroll at ${width}px, controls at least 44px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await addTask(page, 'tasks', {
      title: 'A very long title '.repeat(6).trim(),
      description: 'x'.repeat(300),
    })
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

test('makes no requests outside localhost', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    const url = new URL(r.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol.startsWith('http')) {
      external.push(r.url())
    }
  })
  await freshBoard(page)
  await addTask(page, 'tasks', { title: 'Offline' })
  expect(external).toEqual([])
})
