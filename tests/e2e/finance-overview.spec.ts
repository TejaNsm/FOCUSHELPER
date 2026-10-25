import { expect, test } from '@playwright/test'
import { addTask, column, freshBoard } from './helpers'
import { addFinanceTransaction, clearFinanceData, selectFinance, selectFinanceView } from './finance-helpers'

test.beforeEach(async ({ page }) => {
  await freshBoard(page)
  await clearFinanceData(page)
})

test('US1: same-tab finance navigation and records remain independent from task board', async ({ page }) => {
  await addTask(page, 'tasks', { title: 'Keep task data' })
  await selectFinance(page)
  await selectFinanceView(page, 'Accounts')
  await page.getByLabel('Account name').fill('Wallet')
  await page.getByRole('button', { name: 'Save account' }).click()
  await page.getByLabel('New category').fill('Salary')
  await page.getByLabel('Category type').selectOption('income')
  await page.getByRole('button', { name: 'Add category' }).click()
  await selectFinanceView(page, 'Transactions')
  await addFinanceTransaction(page, { type: 'Income', amount: '1234.50', note: 'Salary' })
  await expect(page.getByText('₹1,234.50')).toBeVisible()
  await page.reload()
  await selectFinance(page)
  await selectFinanceView(page, 'Transactions')
  await expect(page.getByText('Salary')).toBeVisible()
  const saved = await page.evaluate(() => ({
    finance: localStorage.getItem('focushelper.finance.v1'),
    board: localStorage.getItem('focushelper.board.v1'),
  }))
  expect(saved.finance).toContain('Wallet')
  expect(saved.board).toContain('Keep task data')
  await page.getByRole('tab', { name: 'Task Board' }).click()
  await expect(column(page, 'tasks').getByText('Keep task data')).toBeVisible()
})

test('US1: income, expense, refund, and transfer produce the expected cash flow', async ({ page }) => {
  await selectFinance(page)
  await selectFinanceView(page, 'Accounts')
  await page.getByLabel('Account name').fill('Wallet')
  await page.getByRole('button', { name: 'Save account' }).click()
  await page.getByLabel('Account name').fill('Bank')
  await page.getByRole('button', { name: 'Save account' }).click()
  await page.getByLabel('New category').fill('Salary')
  await page.getByLabel('Category type').selectOption('income')
  await page.getByRole('button', { name: 'Add category' }).click()
  await page.getByLabel('New category').fill('Food')
  await page.getByLabel('Category type').selectOption('expense')
  await page.getByRole('button', { name: 'Add category' }).click()

  await selectFinanceView(page, 'Transactions')
  await addFinanceTransaction(page, { type: 'Income', amount: '1000', note: 'Salary', account: 'Wallet', category: 'Salary' })
  await addFinanceTransaction(page, { type: 'Expense', amount: '200', note: 'Groceries', account: 'Wallet', category: 'Food' })
  await addFinanceTransaction(page, { type: 'Refund', amount: '25', note: 'Returned groceries', account: 'Wallet', category: 'Food' })
  await addFinanceTransaction(page, { type: 'Transfer', amount: '100', note: 'Move to bank', sourceAccount: 'Wallet', destinationAccount: 'Bank' })

  await selectFinanceView(page, 'Overview')
  await expect(page.getByText('₹1,000.00')).toBeVisible()
  await expect(page.getByText('₹175.00')).toBeVisible()
  await expect(page.getByText('₹725.00')).toBeVisible()
  await expect(page.getByText('₹100.00')).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('focushelper.finance.v1') ?? '{}'))
  expect(stored.transactions.map((item: { type: string }) => item.type).sort()).toEqual(['expense', 'income', 'refund', 'transfer'])
})
