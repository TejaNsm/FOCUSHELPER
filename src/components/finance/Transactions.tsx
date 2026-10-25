import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TransactionDialog } from '@/components/finance/TransactionDialog'
import { accountBalance, emptyFinanceDocument, formatMoney, type FinanceAccount, type FinanceCategory, type FinanceTransaction, type TransactionType } from '@/lib/finance'

interface TransactionsProps {
  transactions: FinanceTransaction[]
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onDelete: (transaction: FinanceTransaction) => void
}

type SortKey = 'date' | 'amount' | 'category'
const control = 'h-11 rounded-md border-2 border-input bg-background px-3'

export function Transactions({ transactions, accounts, categories, onSave, onDelete }: TransactionsProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceTransaction | undefined>()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('')
  const [accountFilter, setAccountFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sort, setSort] = useState<SortKey>('date')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')

  const accountBalances = useMemo(() => {
    const doc = { ...emptyFinanceDocument(), accounts, transactions }
    return new Map(accounts.map((account) => [account.id, accountBalance(doc, account)]))
  }, [accounts, transactions])

  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return transactions.filter((tx) => {
      const accountNames = [tx.accountId, tx.sourceAccountId, tx.destinationAccountId]
        .map((id) => accounts.find((account) => account.id === id)?.name ?? '')
      const category = categories.find((item) => item.id === tx.categoryId)?.name ?? ''
      const text = [tx.note ?? '', category, ...accountNames].join(' ').toLocaleLowerCase()
      return (!search || text.includes(search)) &&
        (!typeFilter || tx.type === typeFilter) &&
        (!accountFilter || tx.accountId === accountFilter || tx.sourceAccountId === accountFilter || tx.destinationAccountId === accountFilter) &&
        (!categoryFilter || tx.categoryId === categoryFilter) &&
        (recurringFilter === 'all' || (recurringFilter === 'yes') === Boolean(tx.recurringItemId)) &&
        (!fromDate || tx.date >= fromDate) &&
        (!toDate || tx.date <= toDate)
    }).sort((a, b) => {
      const categoryA = categories.find((item) => item.id === a.categoryId)?.name ?? ''
      const categoryB = categories.find((item) => item.id === b.categoryId)?.name ?? ''
      const primary = sort === 'date' ? a.date.localeCompare(b.date) : sort === 'amount' ? a.amountMinor - b.amountMinor : categoryA.localeCompare(categoryB)
      return (primary || a.createdAt - b.createdAt) * (direction === 'asc' ? 1 : -1)
    })
  }, [accounts, categories, transactions, query, typeFilter, accountFilter, categoryFilter, recurringFilter, fromDate, toDate, sort, direction])

  function edit(tx: FinanceTransaction) {
    setEditing(tx)
    setOpen(true)
  }

  return (
    <section aria-labelledby="transactions-heading" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="transactions-heading" className="text-xl font-bold">Transactions</h2><p className="text-sm text-muted-foreground">{visible.length} shown · {transactions.length} saved</p></div>
        <Button className="min-h-11" onClick={() => { setEditing(undefined); setOpen(true) }}>Add transaction</Button>
      </div>
      <div className="grid gap-3 rounded-md border-2 border-[var(--ink)] bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5"><Label htmlFor="finance-search">Search note, category, or account</Label><Input id="finance-search" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-filter-type">Type</Label><select id="finance-filter-type" className={control} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}><option value="">All types</option>{(['income', 'expense', 'refund', 'transfer', 'loan-payment'] as const).map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-filter-account">Account</Label><select id="finance-filter-account" className={control} value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-filter-category">Category</Label><select id="finance-filter-category" className={control} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-from">From date</Label><Input id="finance-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-to">To date</Label><Input id="finance-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-filter-recurring">Recurring</Label><select id="finance-filter-recurring" className={control} value={recurringFilter} onChange={(e) => setRecurringFilter(e.target.value as typeof recurringFilter)}><option value="all">All</option><option value="yes">Recurring</option><option value="no">One-time</option></select></div>
        <div className="grid gap-1.5"><Label htmlFor="finance-sort">Sort</Label><div className="flex gap-2"><select id="finance-sort" className={`${control} min-w-0 flex-1`} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="date">Date</option><option value="amount">Amount</option><option value="category">Category</option></select><Button type="button" variant="outline" className="min-h-11" aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}>{direction === 'asc' ? '↑' : '↓'}</Button></div></div>
      </div>
      {visible.length === 0 ? <p className="rounded-md border-2 border-dashed p-6 text-center text-muted-foreground">{transactions.length ? 'No transactions match these filters.' : 'No transactions yet. Add income or an expense to begin.'}</p> : (
        <ul aria-label="Transaction history" className="grid gap-2">
          {visible.map((tx) => {
            const currency = accounts.find(({ id }) => id === tx.accountId)?.currency ?? 'INR'
            const category = categories.find(({ id }) => id === tx.categoryId)?.name ?? (tx.type === 'transfer' ? 'Transfer' : 'Uncategorized')
            const account = accounts.find(({ id }) => id === tx.accountId)?.name ?? ''
            return <li key={tx.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-[var(--ink)] bg-card p-3">
              <div className="min-w-0"><p className="font-semibold">{tx.note || category}</p><p className="text-sm text-muted-foreground">{tx.date} · {tx.type} · {category} · {account}</p></div>
              <div className="flex items-center gap-2"><strong>{formatMoney(tx.amountMinor, currency)}</strong>{tx.type !== 'loan-payment' && <Button type="button" variant="outline" className="min-h-11" aria-label={`Edit ${tx.note || tx.type}`} onClick={() => edit(tx)}>Edit</Button>}<Button type="button" variant="outline" className="min-h-11" aria-label={`Delete ${tx.note || tx.type}`} onClick={() => { if (window.confirm('Delete this transaction?')) onDelete(tx) }}>Delete</Button></div>
            </li>
          })}
        </ul>
      )}
      <TransactionDialog open={open} transaction={editing} accounts={accounts} categories={categories} accountBalances={accountBalances} onOpenChange={setOpen} onSave={onSave} />
    </section>
  )
}
