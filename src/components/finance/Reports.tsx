import { useMemo, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { accountBalance, categorySpend, formatMoney, goalProgress, localMonth, localToday, monthSummary, netWorth, type FinanceDocument, type NetWorthSnapshot } from '@/lib/finance'
import { parseFinanceBackup } from '@/lib/finance-storage'

interface ReportsProps {
  document: FinanceDocument
  onSaveSnapshot: (snapshot: Omit<NetWorthSnapshot, 'id'>) => void
  onImport: (document: FinanceDocument) => void
  announce: (message: string) => void
}

export function Reports({ document, onSaveSnapshot, onImport, announce }: ReportsProps) {
  const [month, setMonth] = useState(localMonth())
  const [currency, setCurrency] = useState('INR')
  const [error, setError] = useState('')
  const summary = monthSummary(document, month, currency)
  const categories = document.categories.filter((item) => item.kind === 'expense')
  const months = useMemo(() => {
    const seen = new Set(document.transactions.map((item) => item.date.slice(0, 7)))
    document.budgets.forEach((item) => seen.add(item.month))
    seen.add(month)
    return [...seen].sort()
  }, [document.budgets, document.transactions, month])
  const unlinkedDebts = document.debts.filter((debt) => debt.currency === currency && !debt.liabilityAccountId)
  const currencyAccounts = document.accounts.filter((account) => account.currency === currency)
  const currencies = [...new Set(['INR', ...document.accounts.map(({ currency: code }) => code), ...document.debts.map(({ currency: code }) => code), ...document.goals.map(({ currency: code }) => code)])].sort()

  function saveSnapshot() {
    const accountBalances = currencyAccounts.map((account) => ({ accountId: account.id, amountMinor: accountBalance(document, account) }))
    const assets = currencyAccounts
      .filter((account) => account.classification === 'asset')
      .reduce((sum, account) => sum + Math.max(0, accountBalance(document, account)), 0) +
      currencyAccounts
        .filter((account) => account.classification === 'liability')
        .reduce((sum, account) => sum + Math.max(0, -accountBalance(document, account)), 0)
    const liabilities = currencyAccounts
      .filter((account) => account.classification === 'liability')
      .reduce((sum, account) => sum + Math.max(0, accountBalance(document, account)), 0) +
      currencyAccounts
        .filter((account) => account.classification === 'asset')
        .reduce((sum, account) => sum + Math.max(0, -accountBalance(document, account)), 0) +
      unlinkedDebts.reduce((sum, debt) => sum + debt.remainingMinor, 0)
    const debtBalances = document.debts.filter((debt) => debt.currency === currency).map((debt) => ({ debtId: debt.id, amountMinor: debt.remainingMinor }))
    onSaveSnapshot({
      date: localToday(),
      currency,
      assetTotalMinor: assets,
      liabilityTotalMinor: liabilities,
      netWorthMinor: assets - liabilities,
      accountBalances,
      debtBalances,
    })
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = globalThis.document.createElement('a')
    link.href = url
    link.download = 'focushelper-finance-backup.json'
    link.click()
    URL.revokeObjectURL(url)
    announce('Finance backup exported. Task-board data was not included.')
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = parseFinanceBackup(await file.text())
      if (!window.confirm('Import this backup and replace existing finance data? Task Board data will not change.')) return
      onImport(parsed)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The backup could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section aria-labelledby="reports-heading" className="grid gap-5">
      <div><h2 id="reports-heading" className="text-xl font-bold">Reports &amp; backup</h2><p className="text-sm text-muted-foreground">Reports show entered data only. They do not provide financial advice.</p></div>
      {error && <p role="alert" className="rounded border-2 border-destructive p-3">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5"><Label htmlFor="report-month">Month</Label><Input id="report-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="report-currency">Currency</Label><select id="report-currency" className="h-11 rounded-md border-2 border-input bg-background px-3" value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></div>
      </div>
      <section className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4"><h3 className="text-lg font-semibold">Savings goals</h3>{document.goals.filter((goal) => !goal.archived && goal.currency === currency).length ? <ul className="grid gap-2 sm:grid-cols-2">{document.goals.filter((goal) => !goal.archived && goal.currency === currency).map((goal) => { const progress = goalProgress(document, goal); return <li key={goal.id} className="rounded border p-3"><strong>{goal.name}</strong><p>{formatMoney(progress.allocatedMinor, currency)} saved · {formatMoney(progress.remainingMinor, currency)} remaining</p><progress aria-label={`${goal.name} progress`} max="1" value={progress.progress} className="h-3 w-full accent-primary" /></li> })}</ul> : <p className="text-sm text-muted-foreground">No active savings goals for {currency}.</p>}</section>
      <section className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4">
        <h3 className="text-lg font-semibold">Monthly spending by category</h3>
        {categories.length ? <ul className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <li key={category.id} className="flex justify-between gap-2 rounded border p-2"><span>{category.name}</span><strong>{formatMoney(categorySpend(document, month, category.id, currency), currency)}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">No expense categories recorded.</p>}
      </section>
      <section className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4">
        <h3 className="text-lg font-semibold">Income and expenses</h3>
        <p>Income: {formatMoney(summary.incomeMinor, currency)}</p><p>Expenses: {formatMoney(summary.expenseMinor, currency)}</p><p>Net savings: {formatMoney(summary.netSavingsMinor, currency)}</p>
        <h3 className="text-lg font-semibold">Net worth</h3><p>Current estimate: {formatMoney(netWorth(document, currency), currency)}</p>
        <Button type="button" className="min-h-11 w-fit" onClick={saveSnapshot}>Save current snapshot</Button>
        {document.netWorthSnapshots.filter((snapshot) => snapshot.currency === currency).length ? <ul aria-label="Net worth history" className="grid gap-2 sm:grid-cols-2">{document.netWorthSnapshots.filter((snapshot) => snapshot.currency === currency).sort((a, b) => a.date.localeCompare(b.date)).map((snapshot) => <li key={snapshot.id} className="rounded border p-2">{snapshot.date}: {formatMoney(snapshot.netWorthMinor, currency)}</li>)}</ul> : <p className="text-sm text-muted-foreground">No net-worth snapshots yet. Past values are not inferred.</p>}
      </section>
      <section className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4">
        <h3 className="text-lg font-semibold">Monthly savings and budget performance</h3>
        {months.map((period) => {
          const result = monthSummary(document, period, currency)
          const budgets = document.budgets.filter((item) => item.month === period && item.currency === currency)
          const overall = budgets.find((item) => item.categoryId === null)
          const spent = categorySpend(document, period, null, currency)
          const categoryBudgets = budgets.filter((item) => item.categoryId !== null)
          return <article key={period} className="rounded border p-3"><h4 className="font-semibold">{period}</h4><p>Income {formatMoney(result.incomeMinor, currency)} · Expenses {formatMoney(result.expenseMinor, currency)} · Savings {formatMoney(result.netSavingsMinor, currency)}</p>{overall && <p>Overall budget: {formatMoney(spent, currency)} spent of {formatMoney(overall.limitMinor, currency)} ({overall.limitMinor - spent < 0 ? `over by ${formatMoney(spent - overall.limitMinor, currency)}` : `${formatMoney(overall.limitMinor - spent, currency)} remaining`})</p>}{categoryBudgets.map((budget) => { const spentInCategory = categorySpend(document, period, budget.categoryId, currency); return <p key={budget.id}>{categories.find((category) => category.id === budget.categoryId)?.name ?? 'Category'} budget: {formatMoney(spentInCategory, currency)} spent of {formatMoney(budget.limitMinor, currency)} · {budget.limitMinor - spentInCategory < 0 ? `over by ${formatMoney(spentInCategory - budget.limitMinor, currency)}` : `${formatMoney(budget.limitMinor - spentInCategory, currency)} remaining`}</p> })}</article>
        })}
        {document.debts.filter((debt) => debt.currency === currency).map((debt) => <p key={debt.id}>Debt progress — {debt.name}: {formatMoney(debt.remainingMinor, currency)} remaining of {formatMoney(debt.originalMinor, currency)}</p>)}
      </section>
      <section className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4">
        <h3 className="text-lg font-semibold">Finance backup</h3><p className="text-sm">Export or import finance data only. Import replaces current finance data after confirmation.</p>
        <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="min-h-11" onClick={exportBackup}>Export finance backup</Button><div className="grid gap-1.5"><Label htmlFor="finance-import">Import backup file</Label><Input id="finance-import" type="file" accept="application/json,.json" onChange={importBackup} /></div></div>
      </section>
    </section>
  )
}
