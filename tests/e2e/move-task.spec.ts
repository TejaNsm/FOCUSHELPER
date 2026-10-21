import { expect, test } from '@playwright/test'
import { addTask, column, freshBoard } from './helpers'

test.beforeEach(async ({ page }) => {
  await freshBoard(page)
  await addTask(page, 'tasks', { title: 'Pay rent', deadline: '2030-01-15', description: 'Monthly' })
})

test('US3.1 mouse drag moves task, details intact, persists', async ({ page }) => {
  const handle = page.getByRole('button', { name: 'Reorder Pay rent' })
  const from = (await handle.boundingBox())!
  const to = (await column(page, 'backburner').boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + 150, { steps: 15 })
  await page.mouse.up()

  const target = column(page, 'backburner')
  await expect(target.getByText('Pay rent')).toBeVisible()
  await expect(target.getByText('Monthly')).toBeVisible()
  await expect(column(page, 'tasks').getByText('Pay rent')).toHaveCount(0)

  await page.reload()
  await expect(column(page, 'backburner').getByText('Pay rent')).toBeVisible()
})

test('US3.3 keyboard drag moves task between columns', async ({ page }) => {
  await page.getByRole('button', { name: 'Reorder Pay rent' }).focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(100) // dnd-kit attaches its key listener just after pickup
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Space')
  await expect(column(page, 'backburner').getByText('Pay rent')).toBeVisible()

  await page.getByRole('button', { name: 'Reorder Pay rent' }).focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(100) // dnd-kit attaches its key listener just after pickup
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Space')
  await expect(column(page, 'meetings').getByText('Pay rent')).toBeVisible()
})

test('keyboard drag can be cancelled with Escape', async ({ page }) => {
  await page.getByRole('button', { name: 'Reorder Pay rent' }).focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(100) // dnd-kit attaches its key listener just after pickup
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Escape')
  await expect(column(page, 'tasks').getByText('Pay rent')).toBeVisible()
})

test('Move to… menu moves a task with the keyboard only', async ({ page }) => {
  await page.getByRole('button', { name: 'Move Pay rent to another column' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('menuitem', { name: 'Meetings' }).focus()
  await page.keyboard.press('Enter')
  await expect(column(page, 'meetings').getByText('Pay rent')).toBeVisible()
  await expect(page.locator('p[role="status"]')).toContainText('Moved "Pay rent" to Meetings')
  await page.reload()
  await expect(column(page, 'meetings').getByText('Pay rent')).toBeVisible()
})

test('dropping a task in its own column changes nothing', async ({ page }) => {
  const handle = page.getByRole('button', { name: 'Reorder Pay rent' })
  const from = (await handle.boundingBox())!
  const own = (await column(page, 'tasks').boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(own.x + own.width / 2, own.y + own.height - 20, { steps: 10 })
  await page.mouse.up()
  await expect(column(page, 'tasks').getByText('Pay rent')).toBeVisible()
})
