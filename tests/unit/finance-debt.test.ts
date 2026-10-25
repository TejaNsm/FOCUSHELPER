import { describe, expect, it } from 'vitest'
import { accountBalance, financeReducer, netWorth, payoffMonths } from '@/lib/finance'
import { account, financeDocument } from './finance-fixtures'

describe('debt and payment calculations', () => {
  const debt = {
    id: 'loan', name: 'Car loan', lender: 'Lender', kind: 'loan' as const,
    originalMinor: 100_000, remainingMinor: 80_000, currency: 'INR',
    annualInterestBasisPoints: 0, paymentMinor: 20_000, nextDueDate: '2026-11-01', active: true,
  }

  it('estimates payoff only with a payment greater than periodic interest', () => {
    expect(payoffMonths(debt)).toBe(4)
    expect(payoffMonths({ ...debt, annualInterestBasisPoints: 12_000, paymentMinor: 10 })).toBeNull()
    expect(payoffMonths({ ...debt, annualInterestBasisPoints: undefined })).toBeNull()
  })

  it('records payment outflow and reduces debt by principal only', () => {
    const document = { ...financeDocument, debts: [debt] }
    const next = financeReducer(document, {
      type: 'debt-payment-upsert',
      payment: { id: 'pay', debtId: debt.id, transactionId: 'tx-pay', date: '2026-10-21', totalMinor: 12_000, principalMinor: 10_000, paymentAccountId: account.id },
      transaction: { id: 'tx-pay', type: 'loan-payment', amountMinor: 12_000, principalMinor: 10_000, debtId: debt.id, date: '2026-10-21', accountId: account.id, createdAt: 1, updatedAt: 1 },
    })
    expect(next.debts[0].remainingMinor).toBe(70_000)
    expect(accountBalance(next, account)).toBe(88_000)
  })

  it('reactivates a debt when deleting the payment that completed it', () => {
    const completedDebt = { ...debt, remainingMinor: 0, active: false }
    const document = {
      ...financeDocument,
      debts: [completedDebt],
      transactions: [{ id: 'tx-pay', type: 'loan-payment' as const, amountMinor: 80_000, principalMinor: 80_000, debtId: debt.id, date: '2026-10-21', accountId: account.id, createdAt: 1, updatedAt: 1 }],
      debtPayments: [{ id: 'pay', debtId: debt.id, transactionId: 'tx-pay', date: '2026-10-21', totalMinor: 80_000, principalMinor: 80_000, paymentAccountId: account.id, previousNextDueDate: '2026-11-01' }],
    }
    const next = financeReducer(document, { type: 'transaction-delete', id: 'tx-pay' })
    expect(next.debts[0]).toMatchObject({ remainingMinor: 80_000, active: true, nextDueDate: '2026-11-01' })
    expect(next.debtPayments).toHaveLength(0)
  })

  it('synchronizes a linked liability account when a debt is created or edited', () => {
    const liability = {
      id: 'liability', name: 'Car loan account', type: 'other' as const, currency: 'INR',
      openingBalanceMinor: 0, classification: 'liability' as const, spendable: false, archived: false,
    }
    const document = { ...financeDocument, accounts: [...financeDocument.accounts, liability] }
    const linkedDebt = { ...debt, liabilityAccountId: liability.id }
    const created = financeReducer(document, { type: 'debt-upsert', debt: linkedDebt })
    expect(accountBalance(created, liability)).toBe(linkedDebt.remainingMinor)
    expect(netWorth(created)).toBe(accountBalance(created, account) - linkedDebt.remainingMinor)

    const edited = financeReducer(created, {
      type: 'debt-upsert',
      debt: { ...linkedDebt, remainingMinor: 60_000 },
    })
    expect(accountBalance(edited, liability)).toBe(60_000)
    expect(netWorth(edited)).toBe(accountBalance(edited, account) - 60_000)
  })

  it('keeps linked liability balance aligned after payments and liability transactions', () => {
    const liability = {
      id: 'liability', name: 'Car loan account', type: 'other' as const, currency: 'INR',
      openingBalanceMinor: debt.remainingMinor, classification: 'liability' as const, spendable: false, archived: false,
    }
    const linkedDebt = { ...debt, liabilityAccountId: liability.id }
    const initial = { ...financeDocument, accounts: [...financeDocument.accounts, liability], debts: [linkedDebt] }
    const paid = financeReducer(initial, {
      type: 'debt-payment-upsert',
      payment: { id: 'pay', debtId: debt.id, transactionId: 'tx-pay', date: '2026-10-21', totalMinor: 12_000, principalMinor: 10_000, paymentAccountId: account.id },
      transaction: { id: 'tx-pay', type: 'loan-payment', amountMinor: 12_000, principalMinor: 10_000, debtId: debt.id, date: '2026-10-21', accountId: account.id, createdAt: 1, updatedAt: 1 },
    })
    const updatedDebt = paid.debts[0]
    expect(accountBalance(paid, liability)).toBe(updatedDebt.remainingMinor)

    const withCharge = financeReducer(paid, {
      type: 'transaction-upsert',
      transaction: { id: 'charge', type: 'expense', amountMinor: 500, date: '2026-10-21', accountId: liability.id, categoryId: 'expense-food', createdAt: 2, updatedAt: 2 },
    })
    expect(withCharge.debts[0].remainingMinor).toBe(updatedDebt.remainingMinor + 500)
    expect(accountBalance(withCharge, liability)).toBe(withCharge.debts[0].remainingMinor)
    const withoutCharge = financeReducer(withCharge, { type: 'transaction-delete', id: 'charge' })
    expect(accountBalance(withoutCharge, liability)).toBe(withoutCharge.debts[0].remainingMinor)
  })

  it('recalculates remaining debt and next due date when an earlier payment is deleted', () => {
    const payments = [
      { id: 'pay-1', debtId: debt.id, transactionId: 'tx-1', date: '2026-10-01', totalMinor: 10_000, principalMinor: 8_000, paymentAccountId: account.id, previousNextDueDate: '2026-11-01' },
      { id: 'pay-2', debtId: debt.id, transactionId: 'tx-2', date: '2026-11-01', totalMinor: 10_000, principalMinor: 8_000, paymentAccountId: account.id, previousNextDueDate: '2026-12-01' },
    ]
    const document = {
      ...financeDocument,
      debts: [{ ...debt, remainingMinor: 64_000, nextDueDate: '2027-01-01' }],
      debtPayments: payments,
      transactions: payments.map((payment) => ({
        id: payment.transactionId, type: 'loan-payment' as const, amountMinor: payment.totalMinor,
        principalMinor: payment.principalMinor, debtId: debt.id, date: payment.date,
        accountId: account.id, createdAt: 1, updatedAt: 1,
      })),
    }
    const next = financeReducer(document, { type: 'transaction-delete', id: 'tx-1' })
    expect(next.debts[0]).toMatchObject({ remainingMinor: 72_000, nextDueDate: '2026-12-01' })
    expect(next.debtPayments.map(({ id }) => id)).toEqual(['pay-2'])
  })

  it('updates the existing payment and debt atomically when payment details change', () => {
    const payment = {
      id: 'pay', debtId: debt.id, transactionId: 'tx-pay', date: '2026-10-21',
      totalMinor: 12_000, principalMinor: 10_000, paymentAccountId: account.id,
      previousNextDueDate: '2026-11-01',
    }
    const priorDebt = { ...debt, remainingMinor: 70_000 }
    const priorTransaction = {
      id: payment.transactionId, type: 'loan-payment' as const, amountMinor: payment.totalMinor,
      principalMinor: payment.principalMinor, debtId: debt.id, date: payment.date,
      accountId: account.id, createdAt: 1, updatedAt: 1,
    }
    const document = {
      ...financeDocument,
      debts: [priorDebt],
      debtPayments: [payment],
      transactions: [priorTransaction],
    }
    const next = financeReducer(document, {
      type: 'debt-payment-upsert',
      payment: { ...payment, totalMinor: 8_000, principalMinor: 5_000 },
      transaction: { ...priorTransaction, amountMinor: 8_000, principalMinor: 5_000, updatedAt: 2 },
    })
    expect(next.debts[0].remainingMinor).toBe(75_000)
    expect(next.transactions).toHaveLength(1)
    expect(next.transactions[0]).toMatchObject({ amountMinor: 8_000, principalMinor: 5_000 })
    expect(next.debtPayments[0]).toMatchObject({ totalMinor: 8_000, principalMinor: 5_000 })
    expect(accountBalance(next, account)).toBe(92_000)
  })
})
