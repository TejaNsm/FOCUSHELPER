import { expect, type Locator, type Page } from '@playwright/test'

export const COLUMN_LABELS = { tasks: 'Tasks', meetings: 'Meetings', backburner: 'Backburner' } as const
export type Col = keyof typeof COLUMN_LABELS

export function column(page: Page, col: Col): Locator {
  return page.locator(`section[data-column="${col}"]`)
}

export async function addTask(
  page: Page,
  col: Col,
  task: { title: string; deadline?: string; description?: string },
) {
  await page.getByRole('button', { name: `Add task to ${COLUMN_LABELS[col]}` }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Title (required)').fill(task.title)
  if (task.deadline) await dialog.getByLabel('Deadline').fill(task.deadline)
  if (task.description) await dialog.getByLabel('Description').fill(task.description)
  await dialog.getByRole('button', { name: 'Add task' }).click()
  await expect(dialog).toBeHidden()
}

export async function freshBoard(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}
