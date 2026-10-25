import { expect, test } from '@playwright/test'
import { clearFinanceData, selectFinance, selectFinanceView } from './finance-helpers'
import { addTask, freshBoard } from './helpers'

test.beforeEach(async ({ page }) => {
  await freshBoard(page)
  await clearFinanceData(page)
})

test('debt payments update cash, debt balance, due date, and reports', async ({ page }) => {
  await addTask(page, 'tasks', { title: 'Keep task data' })
  await selectFinance(page)
  await selectFinanceView(page, 'Accounts')
  await page.getByLabel('Account name').fill('Cash')
  await page.getByLabel('Opening balance').fill('2000')
  await page.getByRole('button', { name: 'Save account' }).click()
  await selectFinanceView(page, 'Loans & Debt')

  await page.getByLabel('Name', { exact: true }).fill('Car loan')
  await page.getByLabel('Lender').fill('Local lender')
  await page.getByLabel('Original amount').fill('1000')
  await page.getByLabel('Remaining balance').fill('800')
  await page.getByLabel('Payment amount').fill('100')
  await page.getByLabel('Annual rate (%) optional').fill('0')
  await page.getByLabel('Loan term in months (optional)').fill('12')
  await page.getByLabel('Next due date').fill('2026-01-31')
  await page.getByRole('button', { name: 'Save debt' }).click()
  await page.getByLabel('Debt').selectOption({ label: 'Car loan' })
  await page.getByLabel('Payment account').selectOption({ label: 'Cash · INR' })
  await page.getByLabel('Total paid').fill('100')
  await page.getByLabel('Principal applied').fill('80')
  await page.getByRole('button', { name: 'Save payment' }).click()
  await expect(page.getByText(/₹720\.00 of ₹1,000\.00/)).toBeVisible()
  await expect(page.getByText(/due 2026-02-28/)).toBeVisible()

  await selectFinanceView(page, 'Overview')
  await expect(page.getByText('₹1,900.00')).toBeVisible()
  await selectFinanceView(page, 'Reports')
  await page.getByRole('button', { name: 'Save current snapshot' }).click()
  await expect(page.getByText(/₹1,180\.00/)).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export finance backup' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('focushelper-finance-backup.json')
  const financeBytes = await page.evaluate(() => localStorage.getItem('focushelper.finance.v1'))
  const boardBytes = await page.evaluate(() => localStorage.getItem('focushelper.board.v1'))
  await page.once('dialog', (dialog) => dialog.accept())
  await page.getByLabel('Import backup file').setInputFiles({
    name: 'finance-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(financeBytes ?? ''),
  })
  await expect(page.getByText(/₹1,180\.00/)).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('focushelper.board.v1'))).toBe(boardBytes)
  await page.getByRole('tab', { name: 'Task Board' }).click()
  await expect(page.getByRole('heading', { name: 'Keep task data' })).toBeVisible()
})

test('invalid backup is rejected without changing finance storage', async ({ page }) => {
  await selectFinance(page)
  await selectFinanceView(page, 'Reports')
  const before = await page.evaluate(() => localStorage.getItem('focushelper.finance.v1'))
  await page.getByLabel('Import backup file').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1}'),
  })
  await expect(page.getByRole('alert')).toContainText('invalid or uses an unsupported version')
  expect(await page.evaluate(() => localStorage.getItem('focushelper.finance.v1'))).toBe(before)
})

test('debt payment edits and deletion keep cash, principal, and due dates consistent', async ({ page }) => {
  await selectFinance(page)
  await selectFinanceView(page, 'Accounts')
  await page.getByLabel('Account name').fill('Cash')
  await page.getByLabel('Opening balance').fill('2000')
  await page.getByRole('button', { name: 'Save account' }).click()

  await selectFinanceView(page, 'Loans & Debt')
  await page.getByLabel('Name', { exact: true }).fill('Car loan')
  await page.getByLabel('Lender').fill('Local lender')
  await page.getByLabel('Original amount').fill('1000')
  await page.getByLabel('Remaining balance').fill('800')
  await page.getByLabel('Payment amount').fill('100')
  await page.getByLabel('Next due date').fill('2026-11-01')
  await page.getByRole('button', { name: 'Save debt' }).click()
  await page.getByLabel('Debt').selectOption({ label: 'Car loan' })
  await page.getByLabel('Payment account').selectOption({ label: 'Cash · INR' })
  await page.getByLabel('Total paid').fill('100')
  await page.getByLabel('Principal applied').fill('80')
  await page.getByRole('button', { name: 'Save payment' }).click()
  await expect(page.getByText(/Remaining: ₹720\.00 of ₹1,000\.00/)).toBeVisible()

  await page.getByRole('button', { name: /Edit payment/ }).click()
  await page.getByLabel('Total paid').fill('80')
  await page.getByLabel('Principal applied').fill('50')
  await page.getByRole('button', { name: 'Save payment changes' }).click()
  await expect(page.getByText(/Remaining: ₹750\.00 of ₹1,000\.00/)).toBeVisible()

  await page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: /Delete payment/ }).click()
  await expect(page.getByText(/Remaining: ₹800\.00 of ₹1,000\.00/)).toBeVisible()
  await expect(page.getByText(/due 2026-11-01/)).toBeVisible()
  await selectFinanceView(page, 'Overview')
  await expect(page.getByText('₹2,000.00')).toBeVisible()
})
