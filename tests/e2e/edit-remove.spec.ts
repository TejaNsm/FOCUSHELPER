import { expect, test } from '@playwright/test'
import { addTask, column, freshBoard } from './helpers'

test.beforeEach(async ({ page }) => {
  await freshBoard(page)
  await addTask(page, 'tasks', { title: 'Pay rent', deadline: '2030-01-15', description: 'Monthly' })
})

test('US2.1 edit updates values', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit Pay rent' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title (required)').fill('Pay electricity')
  await dialog.getByLabel('Deadline').fill('2031-02-02')
  await dialog.getByLabel('Description').fill('Bill')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  const tasks = column(page, 'tasks')
  await expect(tasks.getByText('Pay electricity')).toBeVisible()
  await expect(tasks.getByText('Bill')).toBeVisible()
  await expect(tasks.locator('time')).toHaveAttribute('datetime', '2031-02-02')
  await expect(tasks.getByText('Pay rent')).toHaveCount(0)
})

test('US2.2 cancelling an edit leaves the task unchanged', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit Pay rent' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title (required)').fill('Changed')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(column(page, 'tasks').getByText('Pay rent')).toBeVisible()
  await expect(column(page, 'tasks').getByText('Changed')).toHaveCount(0)
})

test('US2.3 confirming removal deletes the task permanently', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete Pay rent' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click()
  await expect(column(page, 'tasks').getByText('Pay rent')).toHaveCount(0)
  await page.reload()
  await expect(column(page, 'tasks').getByText('Pay rent')).toHaveCount(0)
})

test('US2.4 declining removal keeps the task', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete Pay rent' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(column(page, 'tasks').getByText('Pay rent')).toBeVisible()
})

test('past deadline shows an Overdue badge', async ({ page }) => {
  await addTask(page, 'meetings', { title: 'Late one', deadline: '2020-01-01' })
  await expect(column(page, 'meetings').getByText('Overdue')).toBeVisible()
  await expect(column(page, 'tasks').getByText('Overdue')).toHaveCount(0)
})
