import { describe, expect, it } from 'vitest'
import { advanceMonthClamped, advanceRecurrence, categorySpend, emptyFinanceDocument } from '@/lib/finance'
import { account, expenseCategory, financeDocument, incomeCategory, transaction } from './finance-fixtures'

describe('finance budgets and recurring schedules', () => {
  it('subtracts refunds from category spending and excludes transfers', () => {
    const document = {
      ...financeDocument,
      transactions: [
        { ...transaction, id: 'food', type: 'expense' as const, amountMinor: 20_000, categoryId: expenseCategory.id },
        { ...transaction, id: 'refund', type: 'refund' as const, amountMinor: 5_000, categoryId: expenseCategory.id },
        { ...transaction, id: 'transfer', type: 'transfer' as const, amountMinor: 8_000, sourceAccountId: account.id, destinationAccountId: 'bank', accountId: account.id },
      ],
    }
    expect(categorySpend(document, '2026-10', expenseCategory.id)).toBe(15_000)
    expect(categorySpend(document, '2026-10', null)).toBe(15_000)
  })

  it('advances monthly dates and clamps a missing day to month end', () => {
    const item = {
      id: 'bill', name: 'Rent', kind: 'expense' as const, amountMinor: 10_000, currency: 'INR',
      accountId: account.id, categoryId: expenseCategory.id, frequency: 'monthly' as const,
      interval: 1, nextDate: '2026-01-31', active: true,
    }
    expect(advanceRecurrence(item)).toBe('2026-02-28')
    expect(advanceMonthClamped('2024-01-31')).toBe('2024-02-29')
  })

  it('keeps an empty budget baseline at zero and distinguishes categories', () => {
    const document = emptyFinanceDocument()
    document.categories = [incomeCategory, expenseCategory]
    expect(categorySpend(document, '2026-10', expenseCategory.id)).toBe(0)
    expect(categorySpend(document, '2026-10', null)).toBe(0)
  })
})
