import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_CURRENCY,
  fromMinorUnits,
  formatMoney,
  isValidCurrency,
  isNonNegativeMoney,
  toMinorUnits,
  type AccountClassification,
  type AccountType,
  type CategoryKind,
  type FinanceAccount,
  type FinanceCategory,
} from '@/lib/finance'

interface AccountsProps {
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  onSaveAccount: (account: Omit<FinanceAccount, 'id'> & { id?: string }) => void
  onSaveCategory: (category: Omit<FinanceCategory, 'id'> & { id?: string }) => void
  onArchiveAccount: (account: FinanceAccount) => void
  onArchiveCategory: (category: FinanceCategory) => void
}

const fieldClass = 'grid gap-1.5'
const selectClass = 'h-11 min-w-0 rounded-md border-2 border-input bg-background px-3'

export function Accounts({ accounts, categories, onSaveAccount, onSaveCategory, onArchiveAccount, onArchiveCategory }: AccountsProps) {
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>()
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [classification, setClassification] = useState<AccountClassification>('asset')
  const [opening, setOpening] = useState('0')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  const [error, setError] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryKind, setCategoryKind] = useState<CategoryKind>('expense')

  function addAccount(event: FormEvent) {
    event.preventDefault()
    const existing = accounts.find((account) => account.id === editingAccountId)
    const amount = toMinorUnits(opening, currency, true)
    if (!name.trim()) return setError('Account name is required.')
    if (!isValidCurrency(currency)) return setError('Enter a valid ISO currency code.')
    if (!isNonNegativeMoney(amount)) return setError('Opening balance must be a valid non-negative amount.')
    onSaveAccount({
      id: existing?.id,
      name: name.trim(),
      type: existing?.type ?? type,
      currency: existing?.currency ?? currency,
      openingBalanceMinor: amount,
      classification: existing?.classification ?? classification,
      spendable: existing?.spendable ?? classification === 'asset',
      archived: existing?.archived ?? false,
    })
    setEditingAccountId(undefined)
    setName('')
    setOpening('0')
    setError('')
  }

  function addCategory(event: FormEvent) {
    event.preventDefault()
    const normalized = categoryName.trim().toLocaleLowerCase()
    if (!normalized) return setError('Category name is required.')
    if (categories.some((item) => item.id !== editingCategoryId && item.kind === categoryKind && item.name.trim().toLocaleLowerCase() === normalized)) {
      return setError('This category already exists.')
    }
    const existing = categories.find((item) => item.id === editingCategoryId)
    onSaveCategory({ id: editingCategoryId, name: categoryName.trim(), kind: existing?.kind ?? categoryKind, archived: existing?.archived ?? false })
    setEditingCategoryId(undefined)
    setCategoryName('')
    setError('')
  }

  return (
    <section aria-labelledby="accounts-heading" className="grid gap-5">
      <div>
        <h2 id="accounts-heading" className="text-xl font-bold">Accounts &amp; categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">Balances use the opening amount and records you enter.</p>
      </div>
      {error && <p role="alert" className="rounded border-2 border-destructive p-2 text-sm">{error}</p>}
      <form onSubmit={addAccount} className="grid gap-3 rounded-md border-2 border-[var(--ink)] bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <h3 className="text-lg font-semibold sm:col-span-2 lg:col-span-3">{editingAccountId ? 'Edit account' : 'Add account'}</h3>
        <div className={fieldClass}><Label htmlFor="account-name">Account name</Label><Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className={fieldClass}><Label htmlFor="account-type">Type</Label><select id="account-type" disabled={Boolean(editingAccountId)} className={selectClass} value={type} onChange={(e) => setType(e.target.value as AccountType)}>{(['cash', 'bank', 'wallet', 'savings', 'credit-card', 'other'] as const).map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
        <div className={fieldClass}><Label htmlFor="account-classification">Balance type</Label><select id="account-classification" disabled={Boolean(editingAccountId)} className={selectClass} value={classification} onChange={(e) => setClassification(e.target.value as AccountClassification)}><option value="asset">Money held (asset)</option><option value="liability">Amount owed (liability)</option></select></div>
        <div className={fieldClass}><Label htmlFor="account-opening">Opening balance</Label><Input id="account-opening" inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} required /></div>
        <div className={fieldClass}><Label htmlFor="account-currency">Currency</Label><Input id="account-currency" disabled={Boolean(editingAccountId)} value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} required /></div>
        <div className="flex items-end"><Button type="submit" className="min-h-11">{editingAccountId ? 'Save account changes' : 'Save account'}</Button></div>
      </form>
      <ul aria-label="Accounts" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <li key={account.id} className="flex min-w-0 items-center justify-between gap-3 rounded border-2 border-[var(--ink)] bg-card p-3">
            <div className="min-w-0"><p className="font-semibold">{account.name}</p><p className="text-sm text-muted-foreground">{account.type} · {account.classification} · {account.currency}</p><p>{formatMoney(account.openingBalanceMinor, account.currency)} opening</p></div>
            <div className="flex gap-1"><Button type="button" variant="outline" className="min-h-11" onClick={() => { setEditingAccountId(account.id); setName(account.name); setOpening(String(fromMinorUnits(account.openingBalanceMinor, account.currency))); setCurrency(account.currency); setType(account.type); setClassification(account.classification) }}>Edit</Button>{account.archived ? <Button type="button" variant="outline" className="min-h-11" onClick={() => onSaveAccount({ ...account, archived: false })}>Restore</Button> : <Button type="button" variant="outline" className="min-h-11" onClick={() => onArchiveAccount(account)}>Archive</Button>}</div>
          </li>
        ))}
        {accounts.every((account) => account.archived) && <li className="text-sm text-muted-foreground">No accounts yet. Add an account to start.</li>}
      </ul>
      <form onSubmit={addCategory} className="grid gap-3 rounded-md border-2 border-[var(--ink)] bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className={fieldClass}><Label htmlFor="category-name">New category</Label><Input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required /></div>
        <div className={fieldClass}><Label htmlFor="category-kind">Category type</Label><select id="category-kind" disabled={Boolean(editingCategoryId)} className={selectClass} value={categoryKind} onChange={(e) => setCategoryKind(e.target.value as CategoryKind)}><option value="expense">Expense</option><option value="income">Income</option></select></div>
        <div className="flex items-end"><Button type="submit" variant="outline" className="min-h-11">{editingCategoryId ? 'Save category' : 'Add category'}</Button></div>
      </form>
      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Categories">
        {categories.map((category) => <li key={category.id} className="flex items-center justify-between gap-2 rounded border bg-card p-2 text-sm"><span>{category.name} · {category.kind}{category.archived ? ' · archived' : ''}</span><div className="flex gap-1"><Button type="button" variant="outline" className="min-h-11" onClick={() => { setEditingCategoryId(category.id); setCategoryName(category.name); setCategoryKind(category.kind) }}>Edit</Button>{category.archived ? <Button type="button" variant="outline" className="min-h-11" onClick={() => onSaveCategory({ ...category, archived: false })}>Restore</Button> : <Button type="button" variant="outline" className="min-h-11" onClick={() => onArchiveCategory({ ...category, archived: true })}>Archive</Button>}</div></li>)}
        {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
      </ul>
    </section>
  )
}
