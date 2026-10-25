import type { FinanceDocument } from '@/lib/finance'

export const account = {
  id: 'cash-1',
  name: 'Wallet',
  type: 'cash',
  currency: 'INR',
  openingBalanceMinor: 100_000,
  classification: 'asset',
  spendable: true,
  archived: false,
} satisfies FinanceDocument['accounts'][number]

export const incomeCategory = {
  id: 'income-salary',
  name: 'Salary',
  kind: 'income',
  archived: false,
} satisfies FinanceDocument['categories'][number]

export const expenseCategory = {
  id: 'expense-food',
  name: 'Food',
  kind: 'expense',
  archived: false,
} satisfies FinanceDocument['categories'][number]

export const transaction = {
  id: 'tx-income-1',
  type: 'income',
  amountMinor: 50_000,
  date: '2026-10-01',
  accountId: 'cash-1',
  categoryId: 'income-salary',
  note: 'Monthly salary',
  createdAt: 1_797_264_000_000,
  updatedAt: 1_797_264_000_000,
} satisfies FinanceDocument['transactions'][number]

export const financeDocument: FinanceDocument = {
  version: 1,
  accounts: [account],
  categories: [incomeCategory, expenseCategory],
  transactions: [transaction],
  recurringItems: [],
  budgets: [],
  goals: [],
  goalAllocations: [],
  debts: [],
  debtPayments: [],
  netWorthSnapshots: [],
}
