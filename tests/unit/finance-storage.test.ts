import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { account, expenseCategory, financeDocument, incomeCategory, transaction } from './finance-fixtures'
import { FINANCE_STORAGE_KEY, loadFinance, saveFinance } from '@/lib/finance-storage'

describe('finance storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('loads an empty version-1 finance document without modifying task storage', () => {
    localStorage.setItem('focushelper.board.v1', '{"version":2,"tasks":[]}')
    expect(loadFinance()).toMatchObject({ document: { version: 1, accounts: [] }, writable: true, error: null })
    expect(localStorage.getItem('focushelper.board.v1')).toBe('{"version":2,"tasks":[]}')
  })

  it('saves and reloads a validated finance document under a separate key', () => {
    saveFinance(financeDocument)
    expect(localStorage.getItem(FINANCE_STORAGE_KEY)).toContain('"version":1')
    expect(loadFinance().document).toEqual(financeDocument)
    expect(localStorage.getItem('focushelper.board.v1')).toBeNull()
  })

  it.each([
    ['malformed JSON', '{broken'],
    ['missing collections', JSON.stringify({ version: 1 })],
    ['duplicate account IDs', JSON.stringify({ ...financeDocument, accounts: [account, account] })],
    ['invalid reference', JSON.stringify({ ...financeDocument, transactions: [{ ...transaction, categoryId: 'missing' }] })],
    ['unsupported older version', JSON.stringify({ ...financeDocument, version: 0 })],
    ['unsupported newer version', JSON.stringify({ ...financeDocument, version: 2 })],
  ])('preserves unsafe stored bytes for %s', (_label, raw) => {
    localStorage.setItem(FINANCE_STORAGE_KEY, raw)
    const result = loadFinance()
    expect(result.writable).toBe(false)
    expect(result.error).toBeTruthy()
    expect(localStorage.getItem(FINANCE_STORAGE_KEY)).toBe(raw)
  })

  it('rejects duplicate category IDs and malformed record arrays', () => {
    const invalid = {
      ...financeDocument,
      categories: [incomeCategory, expenseCategory, { ...expenseCategory, id: incomeCategory.id }],
    }
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(invalid))
    expect(loadFinance().writable).toBe(false)
  })

  it('rejects malformed nested snapshot entries without throwing', () => {
    const invalid = {
      ...financeDocument,
      netWorthSnapshots: [{
        id: 'snapshot', date: '2026-10-21', currency: 'INR', assetTotalMinor: 0,
        liabilityTotalMinor: 0, netWorthMinor: 0, accountBalances: [null], debtBalances: [],
      }],
    }
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(invalid))
    expect(loadFinance().writable).toBe(false)
  })

  it('rejects orphan and over-principal loan-payment transactions in stored data', () => {
    const debt = {
      id: 'debt', name: 'Loan', lender: 'Lender', kind: 'loan' as const,
      originalMinor: 100_000, remainingMinor: 80_000, currency: 'INR',
      paymentMinor: 10_000, nextDueDate: '2026-11-01', active: true,
    }
    const tx = {
      id: 'loan-payment', type: 'loan-payment' as const, amountMinor: 10_000,
      principalMinor: 5_000, debtId: debt.id, date: '2026-10-21', accountId: account.id,
      createdAt: 1, updatedAt: 1,
    }
    const payment = {
      id: 'payment', debtId: debt.id, transactionId: tx.id, date: tx.date,
      totalMinor: tx.amountMinor, principalMinor: tx.principalMinor, paymentAccountId: account.id,
    }
    for (const invalid of [
      { ...financeDocument, debts: [debt], transactions: [tx] },
      {
        ...financeDocument,
        debts: [debt],
        transactions: [{ ...tx, principalMinor: 10_001 }],
        debtPayments: [{ ...payment, principalMinor: 10_001 }],
      },
    ]) {
      const raw = JSON.stringify(invalid)
      localStorage.setItem(FINANCE_STORAGE_KEY, raw)
      expect(loadFinance().writable).toBe(false)
      expect(localStorage.getItem(FINANCE_STORAGE_KEY)).toBe(raw)
    }
  })

  it('rejects two debts linked to the same liability account', () => {
    const liability = {
      id: 'liability', name: 'Loan account', type: 'other' as const, currency: 'INR',
      openingBalanceMinor: 0, classification: 'liability' as const, spendable: false, archived: false,
    }
    const debt = {
      id: 'debt-1', name: 'Loan', lender: 'Lender', kind: 'loan' as const,
      originalMinor: 100_000, remainingMinor: 80_000, currency: 'INR',
      paymentMinor: 10_000, nextDueDate: '2026-11-01', liabilityAccountId: liability.id, active: true,
    }
    const invalid = {
      ...financeDocument,
      accounts: [...financeDocument.accounts, liability],
      debts: [debt, { ...debt, id: 'debt-2', name: 'Second loan' }],
    }
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(invalid))
    expect(loadFinance().writable).toBe(false)
  })

  it('rejects a linked debt whose balance differs from its liability account', () => {
    const liability = {
      id: 'liability', name: 'Loan account', type: 'other' as const, currency: 'INR',
      openingBalanceMinor: 79_999, classification: 'liability' as const, spendable: false, archived: false,
    }
    const debt = {
      id: 'debt', name: 'Loan', lender: 'Lender', kind: 'loan' as const,
      originalMinor: 100_000, remainingMinor: 80_000, currency: 'INR',
      paymentMinor: 10_000, nextDueDate: '2026-11-01', liabilityAccountId: liability.id, active: true,
    }
    const raw = JSON.stringify({
      ...financeDocument,
      accounts: [...financeDocument.accounts, liability],
      debts: [debt],
    })
    localStorage.setItem(FINANCE_STORAGE_KEY, raw)
    expect(loadFinance().writable).toBe(false)
    expect(localStorage.getItem(FINANCE_STORAGE_KEY)).toBe(raw)
  })
})
