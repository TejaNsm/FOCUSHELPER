import { describe, expect, it } from 'vitest'
import { accountBalance, financeReducer, monthSummary, netWorth } from '@/lib/finance'
import { account, expenseCategory, financeDocument, transaction } from './finance-fixtures'

describe('finance transaction calculations', () => {
  it('applies income, expense, and refunds to asset balances and cash flow', () => {
    const document = {
      ...financeDocument,
      transactions: [
        transaction,
        {
          ...transaction,
          id: 'expense-1',
          type: 'expense' as const,
          amountMinor: 12_000,
          categoryId: expenseCategory.id,
          note: 'Groceries',
        },
        {
          ...transaction,
          id: 'refund-1',
          type: 'refund' as const,
          amountMinor: 2_000,
          categoryId: expenseCategory.id,
        },
      ],
    }
    expect(accountBalance(document, account)).toBe(136_000)
    expect(monthSummary(document, '2026-10')).toMatchObject({
      incomeMinor: 50_000,
      expenseMinor: 10_000,
      netSavingsMinor: 40_000,
      savingsRate: 0.8,
    })
  })

  it('does not count transfers as income or expenses and preserves net worth', () => {
    const bank = { ...account, id: 'bank-1', name: 'Bank', openingBalanceMinor: 0 }
    const document = {
      ...financeDocument,
      accounts: [account, bank],
      transactions: [{
        ...transaction,
        id: 'transfer-1',
        type: 'transfer' as const,
        amountMinor: 20_000,
        accountId: account.id,
        sourceAccountId: account.id,
        destinationAccountId: bank.id,
      }],
    }
    expect(accountBalance(document, account)).toBe(80_000)
    expect(accountBalance(document, bank)).toBe(20_000)
    expect(netWorth(document)).toBe(100_000)
    expect(monthSummary(document, '2026-10')).toMatchObject({ incomeMinor: 0, expenseMinor: 0, netSavingsMinor: 0 })
  })

  it('does not create task-board-like or unrelated state on transaction delete', () => {
    const next = financeReducer(financeDocument, { type: 'transaction-delete', id: transaction.id })
    expect(next.transactions).toEqual([])
    expect(next.accounts).toEqual([account])
  })
})
