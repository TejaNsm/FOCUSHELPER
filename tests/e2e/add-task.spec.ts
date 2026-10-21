import { expect, test } from '@playwright/test'
import { addTask, column, freshBoard } from './helpers'

test.beforeEach(async ({ page }) => freshBoard(page))

test('US1.1 first load shows three empty columns', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (const name of ['Tasks', 'Meetings', 'Backburner']) {
    await expect(page.getByRole('region', { name: new RegExp(`^${name}`) })).toBeVisible()
  }
  await expect(page.getByText('No items yet')).toHaveCount(3)
})

test('US1.2 add task with all fields to each column', async ({ page }) => {
  await addTask(page, 'tasks', { title: 'Write report', deadline: '2030-01-15', description: 'Quarterly' })
  await addTask(page, 'meetings', { title: 'Standup' })
  await addTask(page, 'backburner', { title: 'Learn Rust' })

  const tasks = column(page, 'tasks')
  await expect(tasks.getByText('Write report')).toBeVisible()
  await expect(tasks.getByText('Quarterly')).toBeVisible()
  await expect(tasks.locator('time')).toHaveAttribute('datetime', '2030-01-15')
  await expect(column(page, 'meetings').getByText('Standup')).toBeVisible()
  await expect(column(page, 'backburner').getByText('Learn Rust')).toBeVisible()
})

test('US1.3 blank title is rejected with a message', async ({ page }) => {
  await page.getByRole('button', { name: 'Add task to Tasks' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title (required)').fill('   ')
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Title is required')
  await expect(dialog.getByLabel('Title (required)')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(column(page, 'tasks').getByRole('listitem')).toHaveCount(0)
})

test('US1.4 tasks persist after reload', async ({ page }) => {
  await addTask(page, 'meetings', { title: 'Persisted' })
  await page.reload()
  await expect(column(page, 'meetings').getByText('Persisted')).toBeVisible()
})
