import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { accountBalance, localToday } from '@/lib/finance'
import { saveFinance } from '@/lib/finance-storage'
import { account, expenseCategory, financeDocument } from './finance-fixtures'

describe('Personal Finance workspace', () => {
  it('switches in the same page and keeps task data available', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Personal Finance' }))
    expect(screen.getByRole('heading', { name: 'Personal Finance' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Task Board' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Task Board' }))
    expect(screen.getByRole('heading', { name: 'Task Board' })).toBeInTheDocument()
  })

  it('creates an account and categories and shows an empty overview', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Personal Finance' }))
    expect(screen.getByText(/No accounts yet/)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Accounts' }))
    await user.type(screen.getByLabelText('Account name'), 'Wallet')
    await user.click(screen.getByRole('button', { name: 'Save account' }))
    await user.type(screen.getByLabelText('New category'), 'Food')
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    expect(within(screen.getByLabelText('Accounts')).getByText('Wallet')).toBeInTheDocument()
    expect(screen.getByText('Food · expense')).toBeInTheDocument()
    expect(localStorage.getItem('focushelper.board.v1')).toBeNull()
    expect(localStorage.getItem('focushelper.finance.v1')).toContain('"name":"Wallet"')
  })

  it('records a recurring occurrence only after confirmation and keeps goal allocations off balances', async () => {
    const user = userEvent.setup()
    saveFinance(financeDocument)
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Personal Finance' }))
    await user.click(screen.getByRole('tab', { name: 'Budget' }))
    await user.type(screen.getByLabelText('Name'), 'Rent')
    await user.type(screen.getByLabelText('Expected amount (optional)'), '10')
    await user.type(screen.getByLabelText('Next date'), localToday())
    await user.selectOptions(screen.getByLabelText('Account'), account.id)
    await user.selectOptions(screen.getByLabelText('Category'), expenseCategory.id)
    await user.click(screen.getByRole('button', { name: 'Save recurring item' }))
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('focushelper.finance.v1') ?? '{}').transactions).toHaveLength(1)
    })
    await user.click(screen.getByRole('button', { name: 'Record occurrence' }))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('focushelper.finance.v1') ?? '{}')
      expect(saved.transactions).toHaveLength(2)
      expect(saved.transactions[1].recurringItemId).toBeTruthy()
    })

    await user.click(screen.getByRole('tab', { name: 'Goals' }))
    await user.type(screen.getByLabelText('Goal name'), 'Trip')
    await user.type(screen.getByLabelText('Target amount'), '100')
    await user.click(screen.getByRole('button', { name: 'Create goal' }))
    await user.selectOptions(screen.getByLabelText('Goal'), { label: 'Trip' })
    await user.type(screen.getByLabelText('Allocate amount'), '20')
    await user.click(screen.getByRole('button', { name: 'Allocate' }))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('focushelper.finance.v1') ?? '{}')
      expect(accountBalance(saved, saved.accounts[0])).toBe(accountBalance(financeDocument, account) - 1_000)
      expect(saved.goalAllocations).toHaveLength(1)
    })
  })

  it('edits and deletes a debt payment without leaving stale account or debt balances', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const debt = {
      id: 'loan', name: 'Car loan', lender: 'Lender', kind: 'loan' as const,
      originalMinor: 100_000, remainingMinor: 70_000, currency: 'INR',
      paymentMinor: 12_000, nextDueDate: '2026-12-01', active: true,
    }
    const payment = {
      id: 'pay', debtId: debt.id, transactionId: 'tx-pay', date: '2026-10-21',
      totalMinor: 12_000, principalMinor: 10_000, paymentAccountId: account.id,
      previousNextDueDate: '2026-11-01',
    }
    saveFinance({
      ...financeDocument,
      debts: [debt],
      debtPayments: [payment],
      transactions: [{
        id: payment.transactionId, type: 'loan-payment', amountMinor: payment.totalMinor,
        principalMinor: payment.principalMinor, debtId: debt.id, date: payment.date,
        accountId: account.id, createdAt: 1, updatedAt: 1,
      }],
    })
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Personal Finance' }))
    await user.click(screen.getByRole('tab', { name: 'Loans & Debt' }))
    await user.click(screen.getByRole('button', { name: 'Edit payment 2026-10-21' }))
    await user.clear(screen.getByLabelText('Total paid'))
    await user.type(screen.getByLabelText('Total paid'), '80')
    await user.clear(screen.getByLabelText('Principal applied'))
    await user.type(screen.getByLabelText('Principal applied'), '50')
    await user.click(screen.getByRole('button', { name: 'Save payment changes' }))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('focushelper.finance.v1') ?? '{}')
      expect(saved.debts[0].remainingMinor).toBe(75_000)
      expect(saved.transactions[0].amountMinor).toBe(8_000)
    })
    await user.click(screen.getByRole('button', { name: 'Delete payment 2026-10-21' }))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('focushelper.finance.v1') ?? '{}')
      expect(saved.debts[0].remainingMinor).toBe(80_000)
      expect(saved.transactions).toHaveLength(0)
      expect(saved.debtPayments).toHaveLength(0)
      expect(accountBalance(saved, saved.accounts[0])).toBe(accountBalance(financeDocument, account))
    })
    confirm.mockRestore()
  })
})
