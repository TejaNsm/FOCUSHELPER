import { useCallback, useEffect, useReducer, useState } from 'react'
import {
  createId,
  emptyFinanceDocument,
  isNonNegativeMoney,
  isValidLocalDate,
  isValidMoney,
  advanceMonthClamped,
  advanceRecurrence,
  financeReducer,
  localToday,
  type FinanceAccount,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceDebt,
  type FinanceDocument,
  type FinanceLoadResult,
  type GoalAllocation,
  type NetWorthSnapshot,
  type RecurringItem,
  type SavingsGoal,
  type FinanceTransaction,
  type DebtPayment,
} from '@/lib/finance'
import { loadFinance, saveFinance } from '@/lib/finance-storage'

function storedDocument(): FinanceLoadResult {
  if (typeof window === 'undefined') return { document: emptyFinanceDocument(), error: null, writable: false }
  return loadFinance()
}

export function useFinance() {
  const [initial] = useState(storedDocument)
  const [document, dispatch] = useReducer(financeReducer, initial.document)
  const [canWrite, setCanWrite] = useState(initial.writable)
  const [status, setStatus] = useState('')
  const [storageError, setStorageError] = useState(initial.error)

  useEffect(() => {
    if (!canWrite) return
    try {
      saveFinance(document)
      setStorageError(null)
    } catch {
      setStorageError('Finance changes could not be saved. Check browser storage and available space.')
    }
  }, [canWrite, document])

  const announce = useCallback((message: string) => setStatus(message), [])

  const saveAccount = useCallback((account: Omit<FinanceAccount, 'id'> & { id?: string }) => {
    const id = account.id ?? createId()
    dispatch({ type: 'account-upsert', account: { ...account, id } })
    announce(`${account.id ? 'Updated' : 'Added'} account ${account.name}.`)
  }, [announce])

  const saveCategory = useCallback((category: Omit<FinanceCategory, 'id'> & { id?: string }) => {
    const id = category.id ?? createId()
    dispatch({ type: 'category-upsert', category: { ...category, id } })
    announce(`${category.id ? 'Updated' : 'Added'} category ${category.name}.`)
  }, [announce])

  const saveTransaction = useCallback((input: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = Date.now()
    const existing = input.id ? document.transactions.find(({ id }) => id === input.id) : undefined
    const linkedDebt = document.debts.find(({ liabilityAccountId }) =>
      liabilityAccountId === input.accountId,
    )
    if (linkedDebt && ['income', 'expense', 'refund'].includes(input.type)) {
      const transactionImpact = (transaction?: Pick<FinanceTransaction, 'accountId' | 'type' | 'amountMinor'>) => {
        if (!transaction || transaction.accountId !== input.accountId ||
          !['income', 'expense', 'refund'].includes(transaction.type)) return 0
        return transaction.type === 'expense' ? transaction.amountMinor : -transaction.amountMinor
      }
      const balanceAfter = linkedDebt.remainingMinor -
        transactionImpact(existing) + transactionImpact(input)
      if (balanceAfter < 0 || balanceAfter > linkedDebt.originalMinor) {
        announce('This transaction would make the linked debt balance invalid. No changes were saved.')
        return
      }
    }
    const transaction: FinanceTransaction = {
      ...input,
      id: input.id ?? createId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    dispatch({ type: 'transaction-upsert', transaction })
    announce(`${input.id ? 'Updated' : 'Recorded'} ${input.type.replace('-', ' ')}.`)
  }, [announce, document.transactions])

  const deleteTransaction = useCallback((transaction: FinanceTransaction) => {
    dispatch({ type: 'transaction-delete', id: transaction.id })
    announce('Transaction deleted.')
  }, [announce])

  const archiveAccount = useCallback((account: FinanceAccount) => {
    dispatch({ type: 'account-upsert', account: { ...account, archived: true } })
    announce(`Archived account ${account.name}.`)
  }, [announce])

  const archiveCategory = useCallback((category: FinanceCategory) => {
    dispatch({ type: 'category-upsert', category: { ...category, archived: true } })
    announce(`Archived category ${category.name}.`)
  }, [announce])

  const saveBudget = useCallback((budget: Omit<FinanceBudget, 'id'> & { id?: string }) => {
    const existing = document.budgets.find((item) => item.month === budget.month && item.categoryId === budget.categoryId && item.currency === budget.currency)
    dispatch({ type: 'budget-upsert', budget: { ...budget, id: budget.id ?? existing?.id ?? createId() } })
    announce('Budget saved.')
  }, [announce, document.budgets])

  const saveRecurringItem = useCallback((item: Omit<RecurringItem, 'id'> & { id?: string }) => {
    dispatch({ type: 'recurring-upsert', item: { ...item, id: item.id ?? createId() } })
    announce('Recurring item saved.')
  }, [announce])

  const confirmRecurringItem = useCallback((item: RecurringItem, amountMinor: number) => {
    const now = Date.now()
    dispatch({
      type: 'transaction-upsert',
      transaction: {
        id: createId(),
        type: item.kind,
        amountMinor,
        date: item.nextDate,
        accountId: item.accountId,
        categoryId: item.categoryId,
        note: item.note || item.name,
        recurringItemId: item.id,
        createdAt: now,
        updatedAt: now,
      },
    })
    dispatch({ type: 'recurring-advance', id: item.id, nextDate: advanceRecurrence(item) })
    announce(`Recorded ${item.name}.`)
  }, [announce])

  const skipRecurringItem = useCallback((item: RecurringItem) => {
    dispatch({ type: 'recurring-advance', id: item.id, nextDate: advanceRecurrence(item) })
    announce(`Skipped ${item.name}; no transaction was created.`)
  }, [announce])

  const saveGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => {
    dispatch({ type: 'goal-upsert', goal: { ...goal, id: goal.id ?? createId(), createdAt: goal.createdAt ?? Date.now() } })
    announce(`Saved goal ${goal.name}.`)
  }, [announce])

  const archiveGoal = useCallback((goal: SavingsGoal) => {
    dispatch({ type: 'goal-upsert', goal: { ...goal, archived: true } })
    announce(`Archived goal ${goal.name}.`)
  }, [announce])

  const saveAllocation = useCallback((allocation: Omit<GoalAllocation, 'id'> & { id?: string }) => {
    dispatch({ type: 'allocation-upsert', allocation: { ...allocation, id: allocation.id ?? createId() } })
    announce('Goal allocation saved. Account balances are unchanged.')
  }, [announce])

  const deleteAllocation = useCallback((id: string) => {
    dispatch({ type: 'allocation-delete', id })
    announce('Goal allocation removed. Account balances are unchanged.')
  }, [announce])

  const saveDebt = useCallback((debt: FinanceDebt) => {
    dispatch({ type: 'debt-upsert', debt })
    announce(`Saved debt ${debt.name}.`)
  }, [announce])

  const saveSnapshot = useCallback((snapshot: Omit<NetWorthSnapshot, 'id'>) => {
    dispatch({ type: 'snapshot-add', snapshot: { ...snapshot, id: createId() } })
    announce('Net worth snapshot saved.')
  }, [announce])

  const recordDebtPayment = useCallback((
    debt: FinanceDebt,
    paymentAccountId: string,
    totalMinor: number,
    principalMinor: number,
    paymentId?: string,
    date = localToday(),
  ) => {
    const existingPayment = paymentId
      ? document.debtPayments.find((payment) => payment.id === paymentId)
      : undefined
    const paymentAccount = document.accounts.find(({ id }) => id === paymentAccountId)
    const maxPrincipal = debt.remainingMinor + (existingPayment?.principalMinor ?? 0)
    if (!paymentAccount || paymentAccount.classification !== 'asset' ||
      paymentAccount.currency !== debt.currency || !isValidMoney(totalMinor) ||
      !isNonNegativeMoney(principalMinor) || principalMinor > totalMinor ||
      principalMinor > maxPrincipal || !isValidLocalDate(date) ||
      (existingPayment && existingPayment.debtId !== debt.id)) {
      announce('Debt payment details are invalid. No changes were saved.')
      return
    }
    const now = Date.now()
    const transactionId = existingPayment?.transactionId ?? createId()
    const resolvedPaymentId = existingPayment?.id ?? paymentId ?? createId()
    const transaction: FinanceTransaction = {
      id: transactionId,
      type: 'loan-payment',
      amountMinor: totalMinor,
      date,
      accountId: paymentAccountId,
      debtId: debt.id,
      principalMinor,
      note: `${debt.name} payment`,
      createdAt: now,
      updatedAt: now,
    }
    dispatch({
      type: 'debt-payment-upsert',
      payment: {
        id: resolvedPaymentId,
        debtId: debt.id,
        transactionId,
        date,
        totalMinor,
        principalMinor,
        paymentAccountId,
        previousNextDueDate: existingPayment?.previousNextDueDate ?? debt.nextDueDate,
      },
      transaction,
    })
    if (!existingPayment) {
      const remainingMinor = Math.max(0, debt.remainingMinor - principalMinor)
      dispatch({
        type: 'debt-upsert',
        debt: { ...debt, remainingMinor, active: remainingMinor > 0, nextDueDate: advanceMonthClamped(debt.nextDueDate) },
      })
    }
    announce(`${existingPayment ? 'Updated' : 'Recorded'} payment for ${debt.name}.`)
  }, [announce, document.accounts, document.debtPayments])

  const deleteDebtPayment = useCallback((payment: DebtPayment) => {
    dispatch({ type: 'transaction-delete', id: payment.transactionId })
    announce('Debt payment deleted.')
  }, [announce])

  const importDocument = useCallback((next: FinanceDocument) => {
    try {
      saveFinance(next)
      setCanWrite(true)
      setStorageError(null)
      dispatch({ type: 'replace', document: next })
      announce('Finance backup imported.')
    } catch {
      setStorageError('The validated backup could not be saved. Existing finance data was left unchanged.')
    }
  }, [announce])

  return {
    document,
    status,
    storageError,
    writable: canWrite,
    saveAccount,
    saveCategory,
    saveTransaction,
    deleteTransaction,
    archiveAccount,
    archiveCategory,
    saveBudget,
    saveRecurringItem,
    confirmRecurringItem,
    skipRecurringItem,
    saveGoal,
    archiveGoal,
    saveAllocation,
    deleteAllocation,
    saveDebt,
    saveSnapshot,
    recordDebtPayment,
    deleteDebtPayment,
    importDocument,
    announce,
  }
}

export function newTransactionDate() {
  return localToday()
}
