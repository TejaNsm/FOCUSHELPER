import { expect, test, type Page } from '@playwright/test'
import { addTask, column, freshBoard } from './helpers'

async function makeTouch(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  return (type: string, x = 0, y = 0) =>
    cdp.send('Input.dispatchTouchEvent', {
      type: type as 'touchStart',
      touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
    })
}

test.beforeEach(async ({ page }) => {
  await freshBoard(page)
  await addTask(page, 'tasks', { title: 'Pay rent' })
})

test('US3 touch: long-press then drag moves a task', async ({ page }) => {
  const touch = await makeTouch(page)
  const handle = (await page.getByRole('button', { name: 'Reorder Pay rent' }).boundingBox())!
  const sx = handle.x + handle.width / 2
  await column(page, 'meetings').scrollIntoViewIfNeeded()
  const target = (await column(page, 'meetings').boundingBox())!
  const hx = (await page.getByRole('button', { name: 'Reorder Pay rent' }).boundingBox())!

  await touch('touchStart', hx.x + hx.width / 2, hx.y + hx.height / 2)
  await page.waitForTimeout(350)
  const steps = 12
  const startY = hx.y + hx.height / 2
  const endY = target.y + 40
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', sx, startY + ((endY - startY) * i) / steps)
    await page.waitForTimeout(16)
  }
  await touch('touchEnd')

  await expect(column(page, 'meetings').getByText('Pay rent')).toBeVisible()
})

test('US3 touch: quick swipe does not move the task', async ({ page }) => {
  const touch = await makeTouch(page)
  const h = (await page.getByRole('button', { name: 'Reorder Pay rent' }).boundingBox())!
  const x = h.x + h.width / 2
  const y = h.y + h.height / 2
  await touch('touchStart', x, y)
  for (let i = 1; i <= 6; i++) {
    await touch('touchMove', x, y + i * 40)
    await page.waitForTimeout(10)
  }
  await touch('touchEnd')
  await expect(column(page, 'tasks').getByText('Pay rent')).toBeVisible()
})
