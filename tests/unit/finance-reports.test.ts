import { describe, expect, it } from 'vitest'
import { monthSummary, netWorth } from '@/lib/finance'
import { account, financeDocument, transaction } from './finance-fixtures'
import { parseFinanceBackup } from '@/lib/finance-storage'

describe('finance reports and backup', () => {
  it('calculates net savings and marks savings rate unavailable when income is zero', () => {
    expect(monthSummary(financeDocument, '2026-10')).toMatchObject({ incomeMinor: 50_000, netSavingsMinor: 50_000 })
    expect(monthSummary({ ...financeDocument, transactions: [] }, '2026-10').savingsRate).toBeNull()
  })

  it('counts linked liability accounts once in net worth', () => {
    const liabilityAccount = { ...account, id: 'card', classification: 'liability' as const, openingBalanceMinor: 25_000 }
    const debt = { id: 'debt', name: 'Card', lender: 'Bank', kind: 'credit-card' as const, originalMinor: 25_000, remainingMinor: 25_000, currency: 'INR', paymentMinor: 5_000, nextDueDate: '2026-11-01', liabilityAccountId: 'card', active: true }
    expect(netWorth({ ...financeDocument, accounts: [liabilityAccount], debts: [debt], transactions: [] })).toBe(-25_000)
  })

  it('validates backups fully and rejects malformed or invalid references', () => {
    expect(parseFinanceBackup(JSON.stringify(financeDocument))).toEqual(financeDocument)
    expect(() => parseFinanceBackup('{')).toThrow(/valid JSON/)
    expect(() => parseFinanceBackup(JSON.stringify({ ...financeDocument, transactions: [{ ...transaction, accountId: 'missing' }] }))).toThrow(/invalid or unsupported/)
  })
})
