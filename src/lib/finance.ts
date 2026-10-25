export const DEFAULT_CURRENCY = 'INR'
export const FINANCE_VERSION = 1

export type AccountType = 'cash' | 'bank' | 'wallet' | 'savings' | 'credit-card' | 'other'
export type AccountClassification = 'asset' | 'liability'
export type CategoryKind = 'income' | 'expense'
export type TransactionType = 'income' | 'expense' | 'refund' | 'transfer' | 'loan-payment'
export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly'
export type DebtKind = 'loan' | 'emi' | 'credit-card' | 'other'

export interface FinanceAccount {
  id: string
  name: string
  type: AccountType
  currency: string
  openingBalanceMinor: number
  classification: AccountClassification
  spendable: boolean
  archived: boolean
}

export interface FinanceCategory {
  id: string
  name: string
  kind: CategoryKind
  archived: boolean
}

export interface FinanceTransaction {
  id: string
  type: TransactionType
  amountMinor: number
  date: string
  accountId: string
  sourceAccountId?: string
  destinationAccountId?: string
  categoryId?: string
  note?: string
  recurringItemId?: string
  debtId?: string
  principalMinor?: number
  createdAt: number
  updatedAt: number
}

export interface RecurringItem {
  id: string
  name: string
  kind: CategoryKind
  amountMinor?: number
  currency: string
  accountId: string
  categoryId: string
  frequency: RecurrenceFrequency
  interval: number
  nextDate: string
  note?: string
  active: boolean
}

export interface FinanceBudget {
  id: string
  month: string
  categoryId: string | null
  limitMinor: number
  currency: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetMinor: number
  currency: string
  targetDate?: string
  plannedMonthlyMinor?: number
  createdAt: number
  archived: boolean
}

export interface GoalAllocation {
  id: string
  goalId: string
  amountMinor: number
  date: string
  note?: string
}

export interface FinanceDebt {
  id: string
  name: string
  lender: string
  kind: DebtKind
  originalMinor: number
  remainingMinor: number
  currency: string
  annualInterestBasisPoints?: number
  paymentMinor: number
  nextDueDate: string
  termMonths?: number
  liabilityAccountId?: string
  active: boolean
}

export interface DebtPayment {
  id: string
  debtId: string
  transactionId: string
  date: string
  totalMinor: number
  principalMinor: number
  paymentAccountId: string
  previousNextDueDate?: string
}

export interface NetWorthSnapshot {
  id: string
  date: string
  currency: string
  assetTotalMinor: number
  liabilityTotalMinor: number
  netWorthMinor: number
  accountBalances: { accountId: string; amountMinor: number }[]
  debtBalances: { debtId: string; amountMinor: number }[]
}

export interface FinanceDocument {
  version: number
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  transactions: FinanceTransaction[]
  recurringItems: RecurringItem[]
  budgets: FinanceBudget[]
  goals: SavingsGoal[]
  goalAllocations: GoalAllocation[]
  debts: FinanceDebt[]
  debtPayments: DebtPayment[]
  netWorthSnapshots: NetWorthSnapshot[]
}

export type FinanceAction =
  | { type: 'account-upsert'; account: FinanceAccount }
  | { type: 'category-upsert'; category: FinanceCategory }
  | { type: 'transaction-upsert'; transaction: FinanceTransaction }
  | { type: 'transaction-delete'; id: string }
  | { type: 'budget-upsert'; budget: FinanceBudget }
  | { type: 'recurring-upsert'; item: RecurringItem }
  | { type: 'recurring-advance'; id: string; nextDate: string }
  | { type: 'goal-upsert'; goal: SavingsGoal }
  | { type: 'allocation-upsert'; allocation: GoalAllocation }
  | { type: 'allocation-delete'; id: string }
  | { type: 'debt-upsert'; debt: FinanceDebt }
  | { type: 'debt-payment-upsert'; payment: DebtPayment; transaction: FinanceTransaction }
  | { type: 'snapshot-add'; snapshot: NetWorthSnapshot }
  | { type: 'replace'; document: FinanceDocument }

export interface FinanceLoadResult {
  document: FinanceDocument
  error: string | null
  writable: boolean
}

export function emptyFinanceDocument(): FinanceDocument {
  return {
    version: FINANCE_VERSION,
    accounts: [],
    categories: [],
    transactions: [],
    recurringItems: [],
    budgets: [],
    goals: [],
    goalAllocations: [],
    debts: [],
    debtPayments: [],
    netWorthSnapshots: [],
  }
}

export function isValidMoney(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount > 0
}

export function isNonNegativeMoney(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0
}

export function toMinorUnits(value: string, currency = DEFAULT_CURRENCY, allowZero = false): number | null {
  if (!isValidCurrency(currency)) return null
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  const normalized = value.trim().replace(/,/g, '')
  if (!/^\d+(?:\.\d*)?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  if (fraction.length > digits) return null
  const multiplier = 10 ** digits
  const amount = Number(whole) * multiplier + Number(fraction.padEnd(digits, '0') || 0)
  return Number.isSafeInteger(amount) && (allowZero ? amount >= 0 : amount > 0) ? amount : null
}

export function fromMinorUnits(amount: number, currency = DEFAULT_CURRENCY): number {
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  return amount / 10 ** digits
}

export function formatMoney(amountMinor: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(fromMinorUnits(amountMinor, currency))
}

export function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function isValidMonth(value: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false
  return true
}

export function localToday(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function localMonth(now = new Date()): string {
  return localToday(now).slice(0, 7)
}

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sameMonth(date: string, month: string): boolean {
  return date.slice(0, 7) === month
}

function replaceById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex(({ id }) => id === item.id)
  if (index === -1) return [...items, item]
  return items.map((current) => current.id === item.id ? item : current)
}

export function financeReducer(state: FinanceDocument, action: FinanceAction): FinanceDocument {
  switch (action.type) {
    case 'replace':
      return action.document
    case 'account-upsert':
      return { ...state, accounts: replaceById(state.accounts, action.account) }
    case 'category-upsert':
      return { ...state, categories: replaceById(state.categories, action.category) }
    case 'transaction-upsert': {
      let next = { ...state, transactions: replaceById(state.transactions, action.transaction) }
      const previous = state.transactions.find(({ id }) => id === action.transaction.id)
      for (const { transaction, sign } of [
        { transaction: previous, sign: -1 },
        { transaction: action.transaction, sign: 1 },
      ]) {
        if (!transaction || !['income', 'expense', 'refund'].includes(transaction.type)) continue
        const account = state.accounts.find(({ id }) => id === transaction.accountId)
        if (!account || account.classification !== 'liability') continue
        const debt = next.debts.find(({ liabilityAccountId }) => liabilityAccountId === account.id)
        if (!debt) continue
        const direction = transaction.type === 'expense' ? 1 : -1
        next = {
          ...next,
          debts: replaceById(next.debts, {
            ...debt,
            remainingMinor: debt.remainingMinor + sign * direction * transaction.amountMinor,
          }),
        }
      }
      return next
    }
    case 'transaction-delete': {
      const payment = state.debtPayments.find((item) => item.transactionId === action.id)
      let next = { ...state, transactions: state.transactions.filter((item) => item.id !== action.id) }
      if (payment) {
        const debt = state.debts.find((item) => item.id === payment.debtId)
        if (debt) {
          const remainingMinor = Math.min(debt.originalMinor, debt.remainingMinor + payment.principalMinor)
          const allPayments = state.debtPayments
            .filter((item) => item.debtId === debt.id)
            .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
          const remainingPayments = allPayments.filter((item) => item.transactionId !== action.id)
          const firstDueDate = allPayments[0]?.previousNextDueDate ?? payment.previousNextDueDate ?? debt.nextDueDate
          next = { ...next, debts: replaceById(next.debts, {
            ...debt,
            remainingMinor,
            active: true,
            nextDueDate: advanceMonthClamped(firstDueDate, remainingPayments.length),
          }) }
        }
        next = { ...next, debtPayments: next.debtPayments.filter((item) => item.transactionId !== action.id) }
      }
      const deleted = state.transactions.find(({ id }) => id === action.id)
      if (deleted && ['income', 'expense', 'refund'].includes(deleted.type)) {
        const account = state.accounts.find(({ id }) => id === deleted.accountId)
        const debt = account?.classification === 'liability'
          ? next.debts.find(({ liabilityAccountId }) => liabilityAccountId === account.id)
          : undefined
        if (debt) {
          const direction = deleted.type === 'expense' ? 1 : -1
          next = {
            ...next,
            debts: replaceById(next.debts, {
              ...debt,
              remainingMinor: debt.remainingMinor - direction * deleted.amountMinor,
            }),
          }
        }
      }
      next = next.debts.reduce((result, debt) => syncLinkedLiabilityAccount(result, debt), next)
      return next
    }
    case 'budget-upsert':
      return { ...state, budgets: replaceById(state.budgets, action.budget) }
    case 'recurring-upsert':
      return { ...state, recurringItems: replaceById(state.recurringItems, action.item) }
    case 'recurring-advance':
      return { ...state, recurringItems: state.recurringItems.map((item) => item.id === action.id ? { ...item, nextDate: action.nextDate } : item) }
    case 'goal-upsert':
      return { ...state, goals: replaceById(state.goals, action.goal) }
    case 'allocation-upsert':
      return { ...state, goalAllocations: replaceById(state.goalAllocations, action.allocation) }
    case 'allocation-delete':
      return { ...state, goalAllocations: state.goalAllocations.filter(({ id }) => id !== action.id) }
    case 'debt-upsert':
      return syncLinkedLiabilityAccount(
        { ...state, debts: replaceById(state.debts, action.debt) },
        action.debt,
      )
    case 'debt-payment-upsert': {
      const existing = state.debtPayments.find(({ id }) => id === action.payment.id)
      const debt = state.debts.find(({ id }) => id === action.payment.debtId)
      const adjusted = debt && existing
        ? { ...debt, remainingMinor: debt.remainingMinor + existing.principalMinor }
        : debt
      const remainingMinor = adjusted
        ? Math.max(0, adjusted.remainingMinor - action.payment.principalMinor)
        : 0
      const next = {
        ...state,
        debts: adjusted ? replaceById(state.debts, { ...adjusted, remainingMinor, active: remainingMinor > 0 }) : state.debts,
        debtPayments: replaceById(state.debtPayments, action.payment),
        transactions: replaceById(state.transactions, action.transaction),
      }
      const updatedDebt = next.debts.find(({ id }) => id === action.payment.debtId)
      return updatedDebt ? syncLinkedLiabilityAccount(next, updatedDebt) : next
    }
    case 'snapshot-add':
      return { ...state, netWorthSnapshots: replaceById(state.netWorthSnapshots, action.snapshot) }
  }
}

function syncLinkedLiabilityAccount(document: FinanceDocument, debt: FinanceDebt): FinanceDocument {
  if (!debt.liabilityAccountId) return document
  const account = document.accounts.find(({ id }) => id === debt.liabilityAccountId)
  if (!account) return document
  const balance = accountBalance(document, account)
  const openingBalanceMinor = account.openingBalanceMinor + debt.remainingMinor - balance
  if (!isNonNegativeMoney(openingBalanceMinor)) return document
  return {
    ...document,
    accounts: replaceById(document.accounts, { ...account, openingBalanceMinor }),
  }
}

export function accountBalance(document: FinanceDocument, account: FinanceAccount): number {
  return document.transactions.reduce((balance, transaction) => {
    if (transaction.type === 'loan-payment') {
      const debt = document.debts.find(({ id }) => id === transaction.debtId)
      if (account.classification === 'liability' && debt?.liabilityAccountId === account.id) {
        return balance - (transaction.principalMinor ?? 0)
      }
    }
    if (transaction.type === 'transfer') {
      if (transaction.sourceAccountId === account.id) return balance - transaction.amountMinor
      if (transaction.destinationAccountId === account.id) return balance + transaction.amountMinor
      return balance
    }
    if (transaction.accountId !== account.id) return balance
    const multiplier = account.classification === 'asset' ? 1 : -1
    if (transaction.type === 'income' || transaction.type === 'refund') return balance + multiplier * transaction.amountMinor
    if (transaction.type === 'expense') return balance - multiplier * transaction.amountMinor
    if (transaction.type === 'loan-payment') return balance - transaction.amountMinor
    return balance
  }, account.openingBalanceMinor)
}

export interface MonthSummary {
  incomeMinor: number
  expenseMinor: number
  netSavingsMinor: number
  savingsRate: number | null
}

export function monthSummary(document: FinanceDocument, month: string, currency = DEFAULT_CURRENCY): MonthSummary {
  let incomeMinor = 0
  let expenseMinor = 0
  for (const tx of document.transactions) {
    if (!sameMonth(tx.date, month)) continue
    const account = document.accounts.find(({ id }) => id === tx.accountId)
    if ((account?.currency ?? currency) !== currency) continue
    if (tx.type === 'income') incomeMinor += tx.amountMinor
    else if (tx.type === 'expense') expenseMinor += tx.amountMinor
    else if (tx.type === 'refund') expenseMinor -= tx.amountMinor
    else if (tx.type === 'loan-payment') expenseMinor += tx.amountMinor - (tx.principalMinor ?? 0)
  }
  const netSavingsMinor = incomeMinor - expenseMinor
  return { incomeMinor, expenseMinor, netSavingsMinor, savingsRate: incomeMinor === 0 ? null : netSavingsMinor / incomeMinor }
}

export function netWorth(document: FinanceDocument, currency = DEFAULT_CURRENCY): number {
  const accounts = document.accounts.filter((account) => account.currency === currency)
  const linkedDebtIds = new Set(document.debts.filter((debt) => debt.liabilityAccountId).map(({ id }) => id))
  const accountTotal = accounts.reduce((sum, account) => {
    const balance = accountBalance(document, account)
    return sum + (account.classification === 'asset' ? balance : -balance)
  }, 0)
  const unlinkedDebts = document.debts
    .filter((debt) => debt.currency === currency && !linkedDebtIds.has(debt.id))
    .reduce((sum, debt) => sum + debt.remainingMinor, 0)
  return accountTotal - unlinkedDebts
}

export function categorySpend(document: FinanceDocument, month: string, categoryId: string | null, currency = DEFAULT_CURRENCY): number {
  return document.transactions.reduce((sum, tx) => {
    if (!sameMonth(tx.date, month) || (categoryId && tx.categoryId !== categoryId)) return sum
    const account = document.accounts.find(({ id }) => id === tx.accountId)
    if ((account?.currency ?? currency) !== currency) return sum
    if (tx.type === 'expense') return sum + tx.amountMinor
    if (tx.type === 'refund') return sum - tx.amountMinor
    if (tx.type === 'loan-payment') return sum + tx.amountMinor - (tx.principalMinor ?? 0)
    return sum
  }, 0)
}

export function goalProgress(document: FinanceDocument, goal: SavingsGoal, today = localToday()): {
  allocatedMinor: number
  remainingMinor: number
  progress: number
  requiredMonthlyMinor: number | null
} {
  const allocatedMinor = document.goalAllocations
    .filter((allocation) => allocation.goalId === goal.id)
    .reduce((sum, allocation) => sum + allocation.amountMinor, 0)
  const remainingMinor = Math.max(0, goal.targetMinor - allocatedMinor)
  let requiredMonthlyMinor: number | null = null
  if (goal.targetDate && goal.targetDate >= today && remainingMinor > 0) {
    const currentMonth = today.slice(0, 7)
    const targetMonth = goal.targetDate.slice(0, 7)
    const [currentYear, currentMonthNumber] = currentMonth.split('-').map(Number)
    const [targetYear, targetMonthNumber] = targetMonth.split('-').map(Number)
    const months = Math.max(1, (targetYear - currentYear) * 12 + targetMonthNumber - currentMonthNumber + 1)
    requiredMonthlyMinor = Math.ceil(remainingMinor / months)
  }
  return {
    allocatedMinor,
    remainingMinor,
    progress: Math.min(1, allocatedMinor / goal.targetMinor),
    requiredMonthlyMinor,
  }
}

export function advanceRecurrence(item: RecurringItem): string {
  const [year, month, day] = item.nextDate.split('-').map(Number)
  if (item.frequency === 'weekly') {
    const date = new Date(year, month - 1, day + 7 * item.interval)
    return localToday(date)
  }
  const monthDelta = item.frequency === 'monthly' ? item.interval : item.interval * 12
  return advanceMonthClamped(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, monthDelta)
}

export function advanceMonthClamped(value: string, interval = 1): string {
  const [year, month, day] = value.split('-').map(Number)
  const lastDay = new Date(year, month - 1 + interval + 1, 0).getDate()
  const result = new Date(year, month - 1 + interval, Math.min(day, lastDay))
  return localToday(result)
}

export function payoffMonths(debt: FinanceDebt): number | null {
  if (debt.remainingMinor <= 0) return 0
  if (debt.annualInterestBasisPoints === undefined || debt.paymentMinor <= 0) return null
  const monthlyRate = debt.annualInterestBasisPoints / 10_000 / 12
  const interest = Math.ceil(debt.remainingMinor * monthlyRate)
  if (debt.paymentMinor <= interest) return null
  if (monthlyRate === 0) return Math.ceil(debt.remainingMinor / debt.paymentMinor)
  const estimate = Math.log(debt.paymentMinor / (debt.paymentMinor - monthlyRate * debt.remainingMinor)) / Math.log(1 + monthlyRate)
  return Number.isFinite(estimate) ? Math.ceil(estimate) : null
}

export function isValidFinanceDocument(value: unknown): value is FinanceDocument {
  if (!value || typeof value !== 'object') return false
  const doc = value as Record<string, unknown>
  const collections: (keyof FinanceDocument)[] = [
    'accounts', 'categories', 'transactions', 'recurringItems', 'budgets',
    'goals', 'goalAllocations', 'debts', 'debtPayments', 'netWorthSnapshots',
  ]
  if (doc.version !== FINANCE_VERSION || !collections.every((key) => Array.isArray(doc[key]))) return false
  const accounts = doc.accounts as FinanceAccount[]
  const categories = doc.categories as FinanceCategory[]
  const transactions = doc.transactions as FinanceTransaction[]
  const recurringItems = doc.recurringItems as RecurringItem[]
  const budgets = doc.budgets as FinanceBudget[]
  const goals = doc.goals as SavingsGoal[]
  const allocations = doc.goalAllocations as GoalAllocation[]
  const debts = doc.debts as FinanceDebt[]
  const payments = doc.debtPayments as DebtPayment[]
  const snapshots = doc.netWorthSnapshots as NetWorthSnapshot[]
  const idsUnique = collections.every((key) => {
    const list = doc[key] as { id?: unknown }[]
    return list.every((item) => item && typeof item.id === 'string' && item.id.length > 0) &&
      new Set(list.map((item) => item.id)).size === list.length
  })
  if (!idsUnique) return false
  const accountIds = new Set(accounts.map((item) => item.id))
  const categoryIds = new Set(categories.map((item) => item.id))
  const debtIds = new Set(debts.map((item) => item.id))
  const goalIds = new Set(goals.map((item) => item.id))
  const accountValid = accounts.every((item) =>
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    ['cash', 'bank', 'wallet', 'savings', 'credit-card', 'other'].includes(item.type) &&
    validCurrency(item.currency) &&
    isNonNegativeMoney(item.openingBalanceMinor) &&
    ['asset', 'liability'].includes(item.classification) &&
    typeof item.spendable === 'boolean' && typeof item.archived === 'boolean',
  )
  const categoryValid = categories.every((item) =>
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    ['income', 'expense'].includes(item.kind) && typeof item.archived === 'boolean',
  ) && new Set(categories.map((item) => `${item.kind}|${item.name.trim().toLocaleLowerCase()}`)).size === categories.length
  const transactionValid = transactions.every((item) =>
    typeof item.id === 'string' && ['income', 'expense', 'refund', 'transfer', 'loan-payment'].includes(item.type) &&
    isValidMoney(item.amountMinor) && isValidLocalDate(item.date) &&
    typeof item.accountId === 'string' &&
    (item.type === 'transfer'
      ? typeof item.sourceAccountId === 'string' && typeof item.destinationAccountId === 'string' &&
        accountIds.has(item.sourceAccountId) && accountIds.has(item.destinationAccountId) &&
        item.sourceAccountId !== item.destinationAccountId &&
        accounts.find(({ id }) => id === item.sourceAccountId)?.classification === 'asset' &&
        accounts.find(({ id }) => id === item.destinationAccountId)?.classification === 'asset' &&
        accounts.find(({ id }) => id === item.sourceAccountId)?.currency === accounts.find(({ id }) => id === item.destinationAccountId)?.currency
      : accountIds.has(item.accountId)) &&
    (['income', 'expense', 'refund'].includes(item.type)
      ? typeof item.categoryId === 'string' && categoryIds.has(item.categoryId) &&
        categories.find(({ id }) => id === item.categoryId)?.kind === (item.type === 'income' ? 'income' : 'expense')
      : item.categoryId === undefined || categoryIds.has(item.categoryId)) &&
    (item.type === 'loan-payment'
      ? typeof item.debtId === 'string' && debtIds.has(item.debtId) &&
        isNonNegativeMoney(item.principalMinor) && item.principalMinor <= item.amountMinor
      : item.principalMinor === undefined) &&
    (!item.note || (typeof item.note === 'string' && item.note.length <= 300)) &&
    (item.debtId === undefined || debtIds.has(item.debtId)) &&
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) &&
    typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt),
  )
  const recurringValid = recurringItems.every((item) =>
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    ['income', 'expense'].includes(item.kind) &&
    (item.amountMinor === undefined || isValidMoney(item.amountMinor)) &&
    validCurrency(item.currency) && accountIds.has(item.accountId) && categoryIds.has(item.categoryId) &&
    accounts.find(({ id }) => id === item.accountId)?.currency === item.currency &&
    categories.find(({ id }) => id === item.categoryId)?.kind === item.kind &&
    ['weekly', 'monthly', 'yearly'].includes(item.frequency) &&
    Number.isSafeInteger(item.interval) && item.interval > 0 && isValidLocalDate(item.nextDate) &&
    typeof item.active === 'boolean' && (!item.note || (typeof item.note === 'string' && item.note.length <= 300)),
  )
  const budgetValid = budgets.every((item) =>
    isValidMonth(item.month) && (item.categoryId === null || categoryIds.has(item.categoryId)) &&
    (item.categoryId === null || categories.find(({ id }) => id === item.categoryId)?.kind === 'expense') &&
    isNonNegativeMoney(item.limitMinor) && validCurrency(item.currency),
  ) && new Set(budgets.map((item) => `${item.month}|${item.categoryId ?? '*'}|${item.currency}`)).size === budgets.length
  const goalValid = goals.every((item) =>
    typeof item.name === 'string' && item.name.trim().length > 0 && isValidMoney(item.targetMinor) &&
    validCurrency(item.currency) && (item.targetDate === undefined || isValidLocalDate(item.targetDate)) &&
    (item.plannedMonthlyMinor === undefined || isValidMoney(item.plannedMonthlyMinor)) &&
    Number.isFinite(item.createdAt) && typeof item.archived === 'boolean',
  )
  const allocationValid = allocations.every((item) =>
    goalIds.has(item.goalId) && isValidMoney(item.amountMinor) && isValidLocalDate(item.date) &&
    (!item.note || (typeof item.note === 'string' && item.note.length <= 300)),
  )
  const debtValid = debts.every((item) =>
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    typeof item.lender === 'string' && item.lender.trim().length > 0 &&
    ['loan', 'emi', 'credit-card', 'other'].includes(item.kind) &&
    isValidMoney(item.originalMinor) && isNonNegativeMoney(item.remainingMinor) &&
    item.remainingMinor <= item.originalMinor && validCurrency(item.currency) &&
    (item.annualInterestBasisPoints === undefined || (Number.isSafeInteger(item.annualInterestBasisPoints) && item.annualInterestBasisPoints >= 0)) &&
    isValidMoney(item.paymentMinor) && isValidLocalDate(item.nextDueDate) &&
    (item.termMonths === undefined || (Number.isSafeInteger(item.termMonths) && item.termMonths > 0)) &&
    (item.liabilityAccountId === undefined || (
      accountIds.has(item.liabilityAccountId) &&
      accounts.find(({ id }) => id === item.liabilityAccountId)?.classification === 'liability' &&
      accounts.find(({ id }) => id === item.liabilityAccountId)?.currency === item.currency
    )) &&
    typeof item.active === 'boolean',
  ) && new Set(debts.filter((item) => item.liabilityAccountId).map((item) => item.liabilityAccountId)).size ===
    debts.filter((item) => item.liabilityAccountId).length
  const paymentValid = payments.every((item) =>
    debtIds.has(item.debtId) && transactions.some((tx) =>
      tx.id === item.transactionId && tx.type === 'loan-payment' && tx.debtId === item.debtId &&
      tx.amountMinor === item.totalMinor && tx.principalMinor === item.principalMinor &&
      tx.principalMinor <= tx.amountMinor && tx.accountId === item.paymentAccountId,
    ) &&
    isValidLocalDate(item.date) && isValidMoney(item.totalMinor) && isNonNegativeMoney(item.principalMinor) &&
    item.principalMinor <= item.totalMinor && accountIds.has(item.paymentAccountId) &&
    accounts.find(({ id }) => id === item.paymentAccountId)?.currency === debts.find(({ id }) => id === item.debtId)?.currency &&
    (item.previousNextDueDate === undefined || isValidLocalDate(item.previousNextDueDate)),
  )
  const loanPaymentsHaveRecords = transactions.every((transaction) =>
    transaction.type !== 'loan-payment' || payments.some((payment) =>
      payment.transactionId === transaction.id && payment.debtId === transaction.debtId,
    ),
  )
  const linkedDebtBalancesValid = debts.every((debt) => {
    if (!debt.liabilityAccountId) return true
    const account = accounts.find(({ id }) => id === debt.liabilityAccountId)
    return Boolean(account && accountBalance(value as FinanceDocument, account) === debt.remainingMinor)
  })
  const snapshotValid = snapshots.every((item) =>
    isValidLocalDate(item.date) && validCurrency(item.currency) &&
    isNonNegativeMoney(item.assetTotalMinor) && isNonNegativeMoney(item.liabilityTotalMinor) &&
    Number.isSafeInteger(item.netWorthMinor) && item.netWorthMinor === item.assetTotalMinor - item.liabilityTotalMinor &&
    Array.isArray(item.accountBalances) && Array.isArray(item.debtBalances) &&
    item.accountBalances.every((balance) => balance && typeof balance === 'object' && accountIds.has(balance.accountId) && Number.isSafeInteger(balance.amountMinor)) &&
    item.debtBalances.every((balance) => balance && typeof balance === 'object' && debtIds.has(balance.debtId) && isNonNegativeMoney(balance.amountMinor)),
  )
  return accountValid && categoryValid && transactionValid && recurringValid && budgetValid &&
    goalValid && allocationValid && debtValid && paymentValid && loanPaymentsHaveRecords &&
    linkedDebtBalancesValid && snapshotValid
}

export function isValidCurrency(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) return false
  try {
    if (typeof Intl.supportedValuesOf === 'function' && !Intl.supportedValuesOf('currency').includes(value)) return false
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: value })
    return true
  } catch {
    return false
  }
}

const validCurrency = isValidCurrency
