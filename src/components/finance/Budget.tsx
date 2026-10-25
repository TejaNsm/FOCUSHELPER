import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  categorySpend,
  fromMinorUnits,
  formatMoney,
  isValidLocalDate,
  isValidMonth,
  localMonth,
  toMinorUnits,
  type FinanceAccount,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceDocument,
  type RecurringItem,
} from '@/lib/finance'

interface BudgetProps {
  document: FinanceDocument
  onSaveBudget: (budget: Omit<FinanceBudget, 'id'> & { id?: string }) => void
  onSaveRecurring: (item: Omit<RecurringItem, 'id'> & { id?: string }) => void
  onConfirmRecurring: (item: RecurringItem, amountMinor: number) => void
  onSkipRecurring: (item: RecurringItem) => void
}

const control = 'h-11 rounded-md border-2 border-input bg-background px-3'
const field = 'grid gap-1.5'

export function Budget({ document, onSaveBudget, onSaveRecurring, onConfirmRecurring, onSkipRecurring }: BudgetProps) {
  const [editingBudgetId, setEditingBudgetId] = useState<string | undefined>()
  const [editingRecurringId, setEditingRecurringId] = useState<string | undefined>()
  const [month, setMonth] = useState(localMonth())
  const [limit, setLimit] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState('INR')
  const [itemName, setItemName] = useState('')
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [error, setError] = useState('')
  const accounts = document.accounts.filter((item) => !item.archived)
  const categories = document.categories.filter((item) => !item.archived)

  function saveBudget(event: FormEvent) {
    event.preventDefault()
    const minor = limit.trim() ? toMinorUnits(limit, budgetCurrency) : null
    if (!isValidMonth(month)) return setError('Enter a valid budget month.')
    if (!minor) return setError('Enter a budget amount greater than zero.')
    onSaveBudget({ id: editingBudgetId, month, categoryId: categoryId || null, limitMinor: minor, currency: budgetCurrency })
    setError('')
    setEditingBudgetId(undefined)
    setLimit('')
  }

  function saveRecurring(event: FormEvent) {
    event.preventDefault()
    const account = accounts.find((item) => item.id === accountId)
    const selectedCategory = categories.find((item) => item.id === itemCategory)
    if (!itemName.trim() || !account || !selectedCategory || selectedCategory.kind !== kind || !isValidLocalDate(nextDate)) {
      return setError('Enter a name, account, matching category, and next date.')
    }
    const parsedMinor = amount.trim() ? toMinorUnits(amount, account.currency) : null
    if (amount.trim() && parsedMinor === null) return setError('Enter an amount with valid currency precision.')
    const minor = parsedMinor ?? undefined
    const existing = document.recurringItems.find((item) => item.id === editingRecurringId)
    onSaveRecurring({
      id: editingRecurringId,
      name: itemName.trim(),
      kind,
      amountMinor: minor,
      currency: account.currency,
      accountId,
      categoryId: itemCategory,
      frequency,
      interval: existing?.interval ?? 1,
      nextDate,
      note: existing?.note,
      active: existing?.active ?? true,
    })
    setItemName('')
    setAmount('')
    setEditingRecurringId(undefined)
    setError('')
  }

  return (
    <section aria-labelledby="budget-heading" className="grid gap-5">
      <div><h2 id="budget-heading" className="text-xl font-bold">Budget &amp; recurring items</h2><p className="text-sm text-muted-foreground">Schedules are plans only. A transaction is created after you confirm it.</p></div>
      {error && <p role="alert" className="rounded border-2 border-destructive p-2 text-sm">{error}</p>}
      <div className="grid gap-3 rounded-md border-2 border-[var(--ink)] bg-card p-4">
        <h3 className="text-lg font-semibold">Monthly budgets</h3>
        <form onSubmit={saveBudget} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className={field}><Label htmlFor="budget-month">Month</Label><Input id="budget-month" type="month" disabled={Boolean(editingBudgetId)} value={month} onChange={(e) => setMonth(e.target.value)} required /></div>
          <div className={field}><Label htmlFor="budget-category">Scope</Label><select id="budget-category" disabled={Boolean(editingBudgetId)} className={control} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Overall</option>{categories.filter((item) => item.kind === 'expense').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className={field}><Label htmlFor="budget-amount">Limit</Label><Input id="budget-amount" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} required /></div>
          <div className={field}><Label htmlFor="budget-currency">Currency</Label><Input id="budget-currency" disabled={Boolean(editingBudgetId)} value={budgetCurrency} maxLength={3} onChange={(e) => setBudgetCurrency(e.target.value.toUpperCase())} /></div>
          <div className="flex items-end"><Button className="min-h-11" type="submit">{editingBudgetId ? 'Update budget' : 'Save budget'}</Button></div>
        </form>
        {document.budgets.filter((item) => item.month === month).length ? <ul className="grid gap-2 sm:grid-cols-2">{document.budgets.filter((item) => item.month === month).map((budget) => {
          const spent = categorySpend(document, month, budget.categoryId, budget.currency)
          const left = budget.limitMinor - spent
          const label = budget.categoryId ? categories.find((item) => item.id === budget.categoryId)?.name ?? 'Archived category' : 'Overall'
          return <li key={budget.id} className="rounded border p-3"><div className="flex justify-between gap-2"><strong>{label}</strong><span>{formatMoney(budget.limitMinor, budget.currency)}</span></div><p className="mt-1 text-sm">Spent {formatMoney(spent, budget.currency)} · {left < 0 ? `Over by ${formatMoney(-left, budget.currency)}` : `Remaining ${formatMoney(left, budget.currency)}`}</p><Button type="button" variant="outline" className="mt-2 min-h-11" onClick={() => { setEditingBudgetId(budget.id); setMonth(budget.month); setCategoryId(budget.categoryId ?? ''); setBudgetCurrency(budget.currency); setLimit(String(fromMinorUnits(budget.limitMinor, budget.currency))) }}>Edit budget</Button></li>
        })}</ul> : <p className="text-sm text-muted-foreground">No budgets for this month.</p>}
      </div>
      <div className="grid gap-3 rounded-md border-2 border-[var(--ink)] bg-card p-4">
        <h3 className="text-lg font-semibold">Recurring income and bills</h3>
        <form onSubmit={saveRecurring} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={field}><Label htmlFor="recurring-name">Name</Label><Input id="recurring-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required /></div>
          <div className={field}><Label htmlFor="recurring-kind">Type</Label><select id="recurring-kind" className={control} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="income">Income</option><option value="expense">Expense</option></select></div>
          <div className={field}><Label htmlFor="recurring-amount">Expected amount (optional)</Label><Input id="recurring-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className={field}><Label htmlFor="recurring-frequency">Frequency</Label><select id="recurring-frequency" className={control} value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
          <div className={field}><Label htmlFor="recurring-next-date">Next date</Label><Input id="recurring-next-date" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} required /></div>
          <div className={field}><Label htmlFor="recurring-account">Account</Label><select id="recurring-account" className={control} value={accountId} onChange={(e) => setAccountId(e.target.value)} required><option value="">Choose account</option>{accounts.map((item: FinanceAccount) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className={field}><Label htmlFor="recurring-category">Category</Label><select id="recurring-category" className={control} value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} required><option value="">Choose category</option>{categories.filter((item) => item.kind === kind).map((item: FinanceCategory) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="flex items-end"><Button className="min-h-11" type="submit">Save recurring item</Button></div>
        </form>
        {document.recurringItems.length ? <ul className="grid gap-2">{document.recurringItems.map((item) => {
          const account = accounts.find((entry) => entry.id === item.accountId)
          return <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div><strong>{item.name}</strong><p className="text-sm text-muted-foreground">{item.kind} · {item.nextDate} · {item.amountMinor ? formatMoney(item.amountMinor, item.currency) : 'Variable amount'}{item.active ? '' : ' · paused'}</p></div><div className="flex flex-wrap gap-2">{item.active && <><Button type="button" variant="outline" className="min-h-11" disabled={!item.amountMinor} onClick={() => item.amountMinor && onConfirmRecurring(item, item.amountMinor)}>Record occurrence</Button>{!item.amountMinor && <Button type="button" variant="outline" className="min-h-11" onClick={() => { const entered = window.prompt(`Enter actual ${item.kind} amount`); if (entered === null) return; const minor = toMinorUnits(entered, item.currency); if (minor === null) { setError('Enter a valid positive amount with the currency precision.'); return } onConfirmRecurring(item, minor) }}>Enter actual amount</Button>}<Button type="button" variant="outline" className="min-h-11" onClick={() => onSkipRecurring(item)}>Skip</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => onSaveRecurring({ ...item, active: false })}>Pause</Button></>}{!item.active && <Button type="button" variant="outline" className="min-h-11" onClick={() => onSaveRecurring({ ...item, active: true })}>Resume</Button>}<Button type="button" variant="outline" className="min-h-11" onClick={() => { setEditingRecurringId(item.id); setItemName(item.name); setKind(item.kind); setAmount(item.amountMinor ? String(fromMinorUnits(item.amountMinor, item.currency)) : ''); setAccountId(item.accountId); setItemCategory(item.categoryId); setNextDate(item.nextDate); setFrequency(item.frequency) }}>Edit</Button></div><span className="sr-only">{account?.name}</span></li>
        })}</ul> : <p className="text-sm text-muted-foreground">No recurring items yet.</p>}
      </div>
    </section>
  )
}
