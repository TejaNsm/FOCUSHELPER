import type { Page } from '@playwright/test'

export const FINANCE_STORAGE_KEY = 'focushelper.finance.v1'

export async function clearFinanceData(page: Page) {
  await page.goto('/')
  await page.evaluate((key) => localStorage.removeItem(key), FINANCE_STORAGE_KEY)
  await page.reload()
}

export async function selectFinance(page: Page) {
  await page.getByRole('tab', { name: 'Personal Finance' }).click()
}

export async function selectFinanceView(page: Page, name: string) {
  await page.getByRole('tab', { name }).click()
}

export async function addFinanceTransaction(
  page: Page,
  transaction: {
    type: 'Income' | 'Expense' | 'Refund' | 'Transfer'
    amount: string
    note: string
    account?: string
    category?: string
    sourceAccount?: string
    destinationAccount?: string
  },
) {
  await page.getByRole('button', { name: 'Add transaction' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Type').selectOption(transaction.type.toLowerCase())
  await dialog.getByLabel('Amount').fill(transaction.amount)
  await dialog.getByLabel('Note').fill(transaction.note)
  if (transaction.type === 'Transfer') {
    if (transaction.sourceAccount) await dialog.getByLabel('From account').selectOption({ label: `${transaction.sourceAccount} · INR` })
    if (transaction.destinationAccount) await dialog.getByLabel('To account').selectOption({ label: `${transaction.destinationAccount} · INR` })
  } else {
    if (transaction.account) await dialog.getByLabel('Account').selectOption({ label: `${transaction.account} · INR` })
    if (transaction.category) await dialog.getByLabel('Category').selectOption({ label: transaction.category })
  }
  await dialog.getByRole('button', { name: 'Save transaction' }).click()
}
