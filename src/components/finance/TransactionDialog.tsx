import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_CURRENCY,
  fromMinorUnits,
  isValidLocalDate,
  toMinorUnits,
  type FinanceAccount,
  type FinanceCategory,
  type FinanceTransaction,
  type TransactionType,
} from '@/lib/finance'

interface TransactionDialogProps {
  open: boolean
  transaction?: FinanceTransaction
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  accountBalances: Map<string, number>
  onOpenChange: (open: boolean) => void
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
}

const control = 'h-11 rounded-md border-2 border-input bg-background px-3'
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TransactionDialog({ open, transaction, accounts, categories, accountBalances, onOpenChange, onSave }: TransactionDialogProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(fromMinorUnits(transaction.amountMinor)) : '')
  const [date, setDate] = useState(transaction?.date ?? today())
  const [accountId, setAccountId] = useState(transaction?.accountId ?? accounts.find((a) => !a.archived)?.id ?? '')
  const [sourceId, setSourceId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    setType(transaction?.type ?? 'expense')
    setDate(transaction?.date ?? today())
    setAccountId(transaction?.accountId ?? accounts.find((a) => !a.archived)?.id ?? '')
    setSourceId(transaction?.sourceAccountId ?? '')
    setDestinationId(transaction?.destinationAccountId ?? '')
    setCategoryId(transaction?.categoryId ?? '')
    setNote(transaction?.note ?? '')
    const currency = accounts.find((item) => item.id === transaction?.accountId)?.currency ?? DEFAULT_CURRENCY
    setAmount(transaction ? String(fromMinorUnits(transaction.amountMinor, currency)) : '')
    setError('')
  }, [accounts, open, transaction])

  const account = accounts.find(({ id }) => id === accountId)
  const categoriesForType = categories.filter(({ archived, kind }) => !archived && kind === (type === 'income' ? 'income' : 'expense'))

  function submit(event: FormEvent) {
    event.preventDefault()
    const currency = account?.currency ?? DEFAULT_CURRENCY
    const amountMinor = toMinorUnits(amount, currency)
    if (!amountMinor) return setError('Enter an amount greater than zero with valid currency precision.')
    if (!isValidLocalDate(date)) return setError('Enter a valid local calendar date.')
    if (type === 'transfer') {
      const source = accounts.find((item) => item.id === sourceId)
      const destination = accounts.find((item) => item.id === destinationId)
      if (!source || !destination || sourceId === destinationId || source.currency !== destination.currency ||
        source.classification !== 'asset' || destination.classification !== 'asset') {
        return setError('Choose two different asset accounts with the same currency.')
      }
      const recordedBalance = accountBalances.get(sourceId) ?? 0
      const sourceBalance = recordedBalance +
        (transaction?.type === 'transfer' && transaction.sourceAccountId === sourceId ? transaction.amountMinor : 0)
      if (amountMinor > sourceBalance) return setError('The transfer cannot exceed the source account balance.')
      onSave({
        id: transaction?.id,
        type,
        amountMinor,
        date,
        accountId: sourceId,
        sourceAccountId: sourceId,
        destinationAccountId: destinationId,
        note: note.trim() || undefined,
      })
    } else {
      if (!accountId) return setError('Choose an account.')
      if (type !== 'loan-payment' && (!categoryId || !categoriesForType.some((item) => item.id === categoryId))) {
        return setError('Choose a category for this transaction.')
      }
      onSave({
        id: transaction?.id,
        type,
        amountMinor,
        date,
        accountId,
        categoryId: categoryId || undefined,
        note: note.trim() || undefined,
      })
    }
    onOpenChange(false)
  }

  const visibleAccounts = accounts.filter((item) => !item.archived)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
          <DialogDescription>Only saved transactions change balances. Scheduled items are not recorded automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid max-h-[70vh] gap-3 overflow-y-auto">
          {error && <p role="alert" className="rounded border-2 border-destructive p-2 text-sm">{error}</p>}
          <div className="grid gap-1.5"><Label htmlFor="finance-tx-type">Type</Label><select id="finance-tx-type" className={control} value={type} onChange={(e) => setType(e.target.value as TransactionType)}><option value="income">Income</option><option value="expense">Expense</option><option value="refund">Refund</option><option value="transfer">Transfer</option></select></div>
          <div className="grid gap-1.5"><Label htmlFor="finance-tx-amount">Amount</Label><Input id="finance-tx-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={account ? account.currency : DEFAULT_CURRENCY} required /></div>
          <div className="grid gap-1.5"><Label htmlFor="finance-tx-date">Date</Label><Input id="finance-tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
          {type === 'transfer' ? (
            <>
              <div className="grid gap-1.5"><Label htmlFor="finance-tx-source">From account</Label><select id="finance-tx-source" className={control} value={sourceId} onChange={(e) => setSourceId(e.target.value)} required><option value="">Choose account</option>{visibleAccounts.filter((item) => item.classification === 'asset').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency}</option>)}</select></div>
              <div className="grid gap-1.5"><Label htmlFor="finance-tx-destination">To account</Label><select id="finance-tx-destination" className={control} value={destinationId} onChange={(e) => setDestinationId(e.target.value)} required><option value="">Choose account</option>{visibleAccounts.filter((item) => item.classification === 'asset').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency}</option>)}</select></div>
            </>
          ) : (
            <>
              <div className="grid gap-1.5"><Label htmlFor="finance-tx-account">Account</Label><select id="finance-tx-account" className={control} value={accountId} onChange={(e) => setAccountId(e.target.value)} required><option value="">Choose account</option>{visibleAccounts.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency}</option>)}</select></div>
              {type !== 'loan-payment' && <div className="grid gap-1.5"><Label htmlFor="finance-tx-category">Category</Label><select id="finance-tx-category" className={control} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required><option value="">Choose category</option>{categoriesForType.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
            </>
          )}
          <div className="grid gap-1.5"><Label htmlFor="finance-tx-note">Note (optional)</Label><Input id="finance-tx-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></div>
          <DialogFooter><Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="min-h-11">{transaction ? 'Save changes' : 'Save transaction'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
