import { expect, test } from '@playwright/test'
import { addTask, column, freshBoard } from './helpers'

test.beforeEach(async ({ page }) => freshBoard(page))

test('searches descriptions and opens the due-today view across columns', async ({ page }) => {
  const today = await page.evaluate(() => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })
  await addTask(page, 'tasks', { title: 'Prepare notes', deadline: today, description: 'Unique phrase' })
  await addTask(page, 'meetings', { title: 'Other work', description: 'Different details' })

  await page.getByLabel('Search title and description').fill('unique PHRASE')
  await expect(column(page, 'tasks').getByText('Prepare notes')).toBeVisible()
  await expect(column(page, 'meetings').getByText('Other work')).toHaveCount(0)

  await page.getByRole('button', { name: 'Due today' }).click()
  await expect(column(page, 'tasks').getByText('Prepare notes')).toBeVisible()
  await expect(column(page, 'meetings').getByText('Other work')).toHaveCount(0)
  await page.getByRole('button', { name: 'Board' }).click()
  await expect(page.getByRole('region', { name: /^Tasks/ })).toBeVisible()
})

test('completes and recovers archived tasks', async ({ page }) => {
  await addTask(page, 'tasks', { title: 'Recoverable task' })

  await page.getByRole('button', { name: 'Mark complete: Recoverable task' }).click()
  await expect(column(page, 'tasks').getByText('Completed')).toBeVisible()
  await page.getByRole('button', { name: 'Archive Recoverable task' }).click()
  await expect(column(page, 'tasks').getByText('Recoverable task')).toHaveCount(0)

  await page.getByLabel('Task status').selectOption('archived')
  await expect(column(page, 'tasks').getByText('Recoverable task')).toBeVisible()
  await page.getByRole('button', { name: 'Restore Recoverable task' }).click()
  await page.getByLabel('Task status').selectOption('active')
  await expect(column(page, 'tasks').getByText('Completed')).toBeVisible()
  await page.reload()
  await expect(column(page, 'tasks').getByText('Completed')).toBeVisible()
})

test('sorts tasks and reorders them with the keyboard in custom order', async ({ page }) => {
  await addTask(page, 'tasks', { title: 'Bravo' })
  await addTask(page, 'tasks', { title: 'Alpha' })
  await addTask(page, 'tasks', { title: 'Charlie' })

  const list = column(page, 'tasks').getByRole('list')
  await page.getByLabel('Sort by').selectOption('title')
  await expect(list.getByRole('listitem').nth(0)).toContainText('Alpha')
  await page.getByLabel('Sort by').selectOption('')
  await page.getByRole('button', { name: 'Reorder Bravo' }).focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Space')
  await expect(list.getByRole('listitem').nth(1)).toContainText('Bravo')
  await page.reload()
  await expect(column(page, 'tasks').getByRole('list').getByRole('listitem').nth(1)).toContainText('Bravo')
})
