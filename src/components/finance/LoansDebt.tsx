import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createId, formatMoney, fromMinorUnits, isValidCurrency, isValidLocalDate, localToday, payoffMonths, toMinorUnits, type DebtPayment, type FinanceAccount, type FinanceDebt } from '@/lib/finance'

interface LoansDebtProps {
  debts: FinanceDebt[]
  payments: DebtPayment[]
  accounts: FinanceAccount[]
  onSave: (debt: FinanceDebt) => void
  onRecordPayment: (debt: FinanceDebt, accountId: string, totalMinor: number, principalMinor: number, paymentId?: string, date?: string) => void
  onDeletePayment: (payment: DebtPayment) => void
}

const control = 'h-11 rounded-md border-2 border-input bg-background px-3'

export function LoansDebt({ debts, payments, accounts, onSave, onRecordPayment, onDeletePayment }: LoansDebtProps) {
  const [editingDebtId, setEditingDebtId] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [lender, setLender] = useState('')
  const [kind, setKind] = useState<FinanceDebt['kind']>('loan')
  const [original, setOriginal] = useState('')
  const [remaining, setRemaining] = useState('')
  const [payment, setPayment] = useState('')
  const [rate, setRate] = useState('')
  const [termMonths, setTermMonths] = useState('')
  const [due, setDue] = useState('')
  const [liabilityAccountId, setLiabilityAccountId] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [selectedDebt, setSelectedDebt] = useState('')
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [total, setTotal] = useState('')
  const [principal, setPrincipal] = useState('')
  const [paymentDate, setPaymentDate] = useState(localToday())
  const [editingPaymentId, setEditingPaymentId] = useState<string | undefined>()
  const [error, setError] = useState('')

  function createDebt(event: FormEvent) {
    event.preventDefault()
    const originalMinor = toMinorUnits(original, currency)
    const remainingMinor = toMinorUnits(remaining, currency, true)
    const paymentMinor = toMinorUnits(payment, currency)
    const annualInterestBasisPoints = rate.trim() ? Math.round(Number(rate) * 100) : undefined
    const term = termMonths.trim() ? Number(termMonths) : undefined
    if (!name.trim() || !lender.trim() || !isValidCurrency(currency) || !originalMinor || remainingMinor === null || remainingMinor > originalMinor || !paymentMinor || !isValidLocalDate(due)) {
      return setError('Enter a name, lender, valid original and remaining balance, payment, and due date.')
    }
    if (rate.trim() && (!Number.isFinite(annualInterestBasisPoints) || annualInterestBasisPoints! < 0)) return setError('Enter a valid non-negative annual interest rate.')
    if (term !== undefined && (!Number.isSafeInteger(term) || term <= 0)) return setError('Loan term must be a positive number of months.')
    const account = accounts.find((item) => item.id === liabilityAccountId)
    if (liabilityAccountId && (!account || account.classification !== 'liability' || account.currency !== currency)) return setError('Choose a same-currency liability account or leave it unlinked.')
    const existing = debts.find((item) => item.id === editingDebtId)
    onSave({
      id: existing?.id ?? createId(),
      name: name.trim(),
      lender: lender.trim(),
      kind,
      originalMinor,
      remainingMinor,
      currency,
      annualInterestBasisPoints,
      termMonths: term,
      paymentMinor,
      nextDueDate: due,
      liabilityAccountId: liabilityAccountId || undefined,
      active: remainingMinor > 0 && (existing?.active ?? true),
    })
    setEditingDebtId(undefined)
    setName('')
    setLender('')
    setOriginal('')
    setRemaining('')
    setPayment('')
    setRate('')
    setDue('')
    setTermMonths('')
    setLiabilityAccountId('')
    setError('')
  }

  function recordPayment(event: FormEvent) {
    event.preventDefault()
    const debt = debts.find((item) => item.id === selectedDebt)
    const account = accounts.find((item) => item.id === paymentAccountId)
    const totalMinor = debt ? toMinorUnits(total, debt.currency) : null
    const principalMinor = debt ? toMinorUnits(principal, debt.currency, true) : null
    if (!debt || !account || account.classification !== 'asset' || account.currency !== debt.currency ||
      !totalMinor || principalMinor === null || !isValidLocalDate(paymentDate)) {
      return setError('Choose a same-currency asset account and enter total paid and principal applied.')
    }
    const oldPayment = payments.find(({ id }) => id === editingPaymentId)
    const availablePrincipal = debt.remainingMinor + (oldPayment?.principalMinor ?? 0)
    if (principalMinor > totalMinor || principalMinor > availablePrincipal) return setError('Principal cannot exceed the payment or remaining debt.')
    onRecordPayment(debt, account.id, totalMinor, principalMinor, editingPaymentId, paymentDate)
    setTotal('')
    setPrincipal('')
    setEditingPaymentId(undefined)
    setPaymentDate(localToday())
    setError('')
  }

  return (
    <section aria-labelledby="debt-heading" className="grid gap-4">
      <div><h2 id="debt-heading" className="text-xl font-bold">Loans &amp; Debt</h2><p className="text-sm text-muted-foreground">Payoff estimates are estimates, not financial advice.</p></div>
      {error && <p role="alert" className="rounded border-2 border-destructive p-2 text-sm">{error}</p>}
      <form onSubmit={createDebt} className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h3 className="text-lg font-semibold sm:col-span-2 lg:col-span-4">{editingDebtId ? 'Edit debt' : 'Add debt'}</h3>
        <div className="grid gap-1.5"><Label htmlFor="debt-name">Name</Label><Input id="debt-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-lender">Lender</Label><Input id="debt-lender" value={lender} onChange={(e) => setLender(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-kind">Type</Label><select id="debt-kind" className={control} value={kind} onChange={(e) => setKind(e.target.value as FinanceDebt['kind'])}><option value="loan">Loan</option><option value="emi">EMI</option><option value="credit-card">Credit card</option><option value="other">Other</option></select></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-currency">Currency</Label><Input id="debt-currency" disabled={Boolean(editingDebtId)} value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-original">Original amount</Label><Input id="debt-original" inputMode="decimal" value={original} onChange={(e) => setOriginal(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-remaining">Remaining balance</Label><Input id="debt-remaining" inputMode="decimal" value={remaining} onChange={(e) => setRemaining(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-payment">Payment amount</Label><Input id="debt-payment" inputMode="decimal" value={payment} onChange={(e) => setPayment(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-rate">Annual rate (%) optional</Label><Input id="debt-rate" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-term">Loan term in months (optional)</Label><Input id="debt-term" type="number" min="1" step="1" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-due">Next due date</Label><Input id="debt-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="debt-liability-account">Linked liability account (optional)</Label><select id="debt-liability-account" disabled={Boolean(editingDebtId)} className={control} value={liabilityAccountId} onChange={(e) => setLiabilityAccountId(e.target.value)}><option value="">No linked account</option>{accounts.filter((item) => item.classification === 'liability' && item.currency === currency && !debts.some((debt) => debt.id !== editingDebtId && debt.liabilityAccountId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <Button type="submit" className="min-h-11 sm:col-span-2 lg:col-span-4">{editingDebtId ? 'Save debt changes' : 'Save debt'}</Button>
      </form>
      <form onSubmit={recordPayment} className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <h3 className="text-lg font-semibold sm:col-span-2 lg:col-span-4">{editingPaymentId ? 'Edit payment' : 'Record payment'}</h3>
        <div className="grid gap-1.5"><Label htmlFor="payment-debt">Debt</Label><select id="payment-debt" disabled={Boolean(editingPaymentId)} className={control} value={selectedDebt} onChange={(e) => setSelectedDebt(e.target.value)}><option value="">Choose debt</option>{debts.filter((item) => (item.active && item.remainingMinor > 0) || item.id === selectedDebt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="payment-account">Payment account</Label><select id="payment-account" className={control} value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)}><option value="">Choose account</option>{accounts.filter((item) => item.classification === 'asset').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="payment-total">Total paid</Label><Input id="payment-total" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="payment-principal">Principal applied</Label><Input id="payment-principal" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="payment-date">Payment date</Label><Input id="payment-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required /></div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4"><Button type="submit" className="min-h-11">{editingPaymentId ? 'Save payment changes' : 'Save payment'}</Button>{editingPaymentId && <Button type="button" variant="outline" className="min-h-11" onClick={() => { setEditingPaymentId(undefined); setTotal(''); setPrincipal(''); setPaymentDate(localToday()) }}>Cancel edit</Button>}</div>
      </form>
      {payments.length > 0 && <section aria-label="Debt payment history" className="grid gap-2"><h3 className="font-semibold">Payment history</h3><ul className="grid gap-2">{payments.map((payment) => {
        const debt = debts.find(({ id }) => id === payment.debtId)
        return <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><span>{debt?.name ?? 'Debt'} · {payment.date} · {formatMoney(payment.totalMinor, debt?.currency ?? 'INR')} total · {formatMoney(payment.principalMinor, debt?.currency ?? 'INR')} principal</span><div className="flex gap-2"><Button type="button" variant="outline" className="min-h-11" aria-label={`Edit payment ${payment.date}`} onClick={() => { setEditingPaymentId(payment.id); setSelectedDebt(payment.debtId); setPaymentAccountId(payment.paymentAccountId); setTotal(String(fromMinorUnits(payment.totalMinor, debt?.currency ?? 'INR'))); setPrincipal(String(fromMinorUnits(payment.principalMinor, debt?.currency ?? 'INR'))); setPaymentDate(payment.date) }}>Edit</Button><Button type="button" variant="outline" className="min-h-11" aria-label={`Delete payment ${payment.date}`} onClick={() => { if (window.confirm('Delete this debt payment?')) onDeletePayment(payment) }}>Delete</Button></div></li>
      })}</ul></section>}
      {debts.filter((item) => item.active).length ? <ul className="grid gap-3 md:grid-cols-2">{debts.filter((item) => item.active).map((debt) => {
        const months = payoffMonths(debt)
        const progress = debt.originalMinor > 0 ? 1 - debt.remainingMinor / debt.originalMinor : 0
        return <li key={debt.id} className="grid gap-2 rounded border-2 border-[var(--ink)] bg-card p-4"><div className="flex justify-between gap-2"><h3 className="font-bold">{debt.name}</h3><span>{debt.kind}</span></div><p>Lender: {debt.lender}</p><p>Remaining: {formatMoney(debt.remainingMinor, debt.currency)} of {formatMoney(debt.originalMinor, debt.currency)}</p><progress aria-label={`${debt.name} paid progress`} max="1" value={progress} className="h-4 w-full accent-primary" /><p>Next payment: {formatMoney(debt.paymentMinor, debt.currency)} due {debt.nextDueDate}</p>{debt.termMonths && <p>Term: {debt.termMonths} months</p>}<p>Payoff estimate: {months === null ? 'Unavailable with current details' : `${months} months (constant rate, monthly compounding, fixed month-end payments)`}</p><div className="flex gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={() => { setEditingDebtId(debt.id); setName(debt.name); setLender(debt.lender); setKind(debt.kind); setOriginal(String(fromMinorUnits(debt.originalMinor, debt.currency))); setRemaining(String(fromMinorUnits(debt.remainingMinor, debt.currency))); setPayment(String(fromMinorUnits(debt.paymentMinor, debt.currency))); setRate(debt.annualInterestBasisPoints === undefined ? '' : String(debt.annualInterestBasisPoints / 100)); setTermMonths(debt.termMonths ? String(debt.termMonths) : ''); setDue(debt.nextDueDate); setCurrency(debt.currency); setLiabilityAccountId(debt.liabilityAccountId ?? '') }}>Edit</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => onSave({ ...debt, active: false })}>Archive</Button></div></li>
      })}</ul> : <p className="rounded border border-dashed p-5 text-muted-foreground">No loans or debts recorded.</p>}
      {debts.some((item) => !item.active) && <section aria-label="Archived debts" className="grid gap-2"><h3 className="font-semibold">Archived debts</h3>{debts.filter((item) => !item.active).map((debt) => <div key={debt.id} className="flex items-center justify-between gap-2 rounded border p-3"><span>{debt.name} · {formatMoney(debt.remainingMinor, debt.currency)} remaining</span><Button type="button" variant="outline" className="min-h-11" onClick={() => onSave({ ...debt, active: debt.remainingMinor > 0 })}>Restore</Button></div>)}</section>}
    </section>
  )
}
