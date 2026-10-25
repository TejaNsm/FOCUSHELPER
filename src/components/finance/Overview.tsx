import { categorySpend, formatMoney, localMonth, localToday, monthSummary, netWorth, type FinanceDocument } from '@/lib/finance'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { accountBalance } from '@/lib/finance'
import { useState } from 'react'

export function Overview({ document }: { document: FinanceDocument }) {
  const [month, setMonth] = useState(localMonth())
  const summary = monthSummary(document, month)
  const accounts = document.accounts.filter((account) => !account.archived)
  const today = localToday()
  const nextIncomeDate = document.recurringItems
    .filter((item) => item.active && item.kind === 'income' && item.currency === 'INR' && item.nextDate >= today)
    .map((item) => item.nextDate)
    .sort()[0]
  const dueBeforeIncome = nextIncomeDate
    ? document.recurringItems.filter((item) => item.active && item.kind === 'expense' && item.currency === 'INR' && item.nextDate >= today && item.nextDate < nextIncomeDate)
    : []
  const debtsDueBeforeIncome = nextIncomeDate
    ? document.debts.filter((debt) => debt.active && debt.remainingMinor > 0 && debt.currency === 'INR' && debt.nextDueDate >= today && debt.nextDueDate < nextIncomeDate)
    : []
  const spendable = accounts.filter((account) => account.currency === 'INR' && account.classification === 'asset' && account.spendable)
    .reduce((sum, account) => sum + accountBalance(document, account), 0)
  const allocated = document.goalAllocations.reduce((sum, allocation) => {
    const goal = document.goals.find((item) => item.id === allocation.goalId)
    return goal?.currency === 'INR' ? sum + allocation.amountMinor : sum
  }, 0)
  const upcomingDebt = document.debts.filter((debt) => debt.active && debt.remainingMinor > 0 && debt.nextDueDate >= today)
  const knownOutflows = dueBeforeIncome.reduce((sum, item) => sum + (item.amountMinor ?? 0), 0) +
    debtsDueBeforeIncome.reduce((sum, debt) => sum + debt.paymentMinor, 0)
  const monthlyBudget = document.budgets.find((budget) => budget.month === month && budget.currency === 'INR' && budget.categoryId === null)
  const monthlyBudgetSpent = categorySpend(document, month, null)
  const recent = [...document.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5)
  const metrics = [
    ['Income', summary.incomeMinor],
    ['Expenses', summary.expenseMinor],
    ['Net savings', summary.netSavingsMinor],
    ['Net worth', netWorth(document)],
  ] as const

  return (
    <section aria-labelledby="overview-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="overview-heading" className="text-xl font-bold">Monthly overview</h2><p className="text-sm text-muted-foreground">Calculated from records you entered.</p></div>
        <div className="grid gap-1.5"><Label htmlFor="overview-month">Month</Label><Input id="overview-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-11" /></div>
      </div>
      {monthlyBudget && <article className="rounded-md border-2 border-[var(--ink)] bg-card p-4"><h3 className="text-sm text-muted-foreground">Overall monthly budget</h3><p className="mt-1 font-bold">{formatMoney(monthlyBudgetSpent)} spent of {formatMoney(monthlyBudget.limitMinor)}</p><p>{monthlyBudget.limitMinor - monthlyBudgetSpent < 0 ? `Over by ${formatMoney(monthlyBudgetSpent - monthlyBudget.limitMinor)}` : `${formatMoney(monthlyBudget.limitMinor - monthlyBudgetSpent)} remaining`}</p></article>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, amount]) => <article key={label} className="rounded-md border-2 border-[var(--ink)] bg-card p-4"><h3 className="text-sm text-muted-foreground">{label}</h3><p className="mt-1 text-2xl font-bold">{formatMoney(amount)}</p></article>)}
        <article className="rounded-md border-2 border-[var(--ink)] bg-card p-4"><h3 className="text-sm text-muted-foreground">Savings rate</h3><p className="mt-1 text-2xl font-bold">{summary.savingsRate === null ? 'Unavailable' : `${(summary.savingsRate * 100).toFixed(1)}%`}</p></article>
      </div>
      <section aria-labelledby="account-balances-heading" className="grid gap-2">
        <h3 id="account-balances-heading" className="text-lg font-semibold">Account balances</h3>
        {accounts.length ? <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{accounts.map((account) => <li key={account.id} className="flex justify-between gap-3 rounded border-2 border-[var(--ink)] bg-card p-3"><span>{account.name}<span className="block text-sm text-muted-foreground">{account.classification} · {account.currency}</span></span><strong>{formatMoney(accountBalance(document, account), account.currency)}</strong></li>)}</ul> : <p className="rounded border border-dashed p-4 text-muted-foreground">No accounts yet. Add an account to see balances.</p>}
      </section>
      <section aria-labelledby="available-heading" className="grid gap-2 rounded-md border-2 border-[var(--ink)] bg-card p-4">
        <h3 id="available-heading" className="text-lg font-semibold">Remaining available money (estimate)</h3>
        <p>{formatMoney(spendable - allocated - (nextIncomeDate ? knownOutflows : 0))}</p>
        <p className="text-sm text-muted-foreground">{nextIncomeDate ? `Subtracts known recurring expenses and debt payments due before income on ${nextIncomeDate}, plus goal allocations. Variable amounts are not estimated.` : 'No next income date is recorded. Upcoming outflows are shown separately and are not subtracted.'}</p>
        {nextIncomeDate && (dueBeforeIncome.length > 0 || debtsDueBeforeIncome.length > 0) && <ul aria-label="Expenses and debts due before next income" className="grid gap-2 sm:grid-cols-2">{[...dueBeforeIncome.map((item) => ({ id: item.id, name: item.name, date: item.nextDate, amountMinor: item.amountMinor, currency: item.currency })), ...debtsDueBeforeIncome.map((debt) => ({ id: debt.id, name: debt.name, date: debt.nextDueDate, amountMinor: debt.paymentMinor, currency: debt.currency }))].map((item) => <li key={item.id} className="rounded border p-2">{item.name} · {item.date} · {item.amountMinor ? formatMoney(item.amountMinor, item.currency) : 'Amount not set'}</li>)}</ul>}
      </section>
      <section aria-labelledby="upcoming-heading" className="grid gap-2">
        <h3 id="upcoming-heading" className="text-lg font-semibold">Upcoming payments</h3>
        {[...document.recurringItems.filter((item) => item.active && item.kind === 'expense' && item.nextDate >= today), ...upcomingDebt.map((debt) => ({ id: `debt-${debt.id}`, name: debt.name, nextDate: debt.nextDueDate, amountMinor: debt.paymentMinor, currency: debt.currency }))].length
          ? <ul className="grid gap-2 sm:grid-cols-2">{[...document.recurringItems.filter((item) => item.active && item.kind === 'expense' && item.nextDate >= today), ...upcomingDebt.map((debt) => ({ id: `debt-${debt.id}`, name: debt.name, nextDate: debt.nextDueDate, amountMinor: debt.paymentMinor, currency: debt.currency }))].sort((a, b) => a.nextDate.localeCompare(b.nextDate)).map((item) => <li key={item.id} className="flex justify-between gap-3 rounded border bg-card p-3"><span>{item.name}<span className="block text-sm text-muted-foreground">{item.nextDate}</span></span><strong>{item.amountMinor ? formatMoney(item.amountMinor, item.currency) : 'Amount not set'}</strong></li>)}</ul>
          : <p className="rounded border border-dashed p-4 text-muted-foreground">No upcoming payments recorded.</p>}
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2"><h3 className="text-lg font-semibold">Savings goals</h3>{document.goals.filter((goal) => !goal.archived).length ? document.goals.filter((goal) => !goal.archived).map((goal) => {
          const saved = document.goalAllocations.filter((item) => item.goalId === goal.id).reduce((sum, item) => sum + item.amountMinor, 0)
          return <p key={goal.id} className="rounded border bg-card p-3">{goal.name}: {formatMoney(saved, goal.currency)} of {formatMoney(goal.targetMinor, goal.currency)}</p>
        }) : <p className="text-sm text-muted-foreground">No goals recorded.</p>}</div>
        <div className="grid gap-2"><h3 className="text-lg font-semibold">Debt summary</h3>{upcomingDebt.length ? upcomingDebt.map((debt) => <p key={debt.id} className="rounded border bg-card p-3">{debt.name}: {formatMoney(debt.remainingMinor, debt.currency)} remaining · due {debt.nextDueDate}</p>) : <p className="text-sm text-muted-foreground">No debt payments upcoming.</p>}</div>
      </section>
      <section className="grid gap-2"><h3 className="text-lg font-semibold">Recent transactions</h3>{recent.length ? <ul className="grid gap-2">{recent.map((tx) => <li key={tx.id} className="flex justify-between gap-3 rounded border bg-card p-3"><span>{tx.note || tx.type}<span className="block text-sm text-muted-foreground">{tx.date}</span></span><strong>{formatMoney(tx.amountMinor, accounts.find((item) => item.id === tx.accountId)?.currency ?? 'INR')}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">No recent transactions.</p>}</section>
      {!document.transactions.length && <p className="rounded border border-dashed p-4 text-muted-foreground">No finance activity yet. Your overview will use only records you enter.</p>}
    </section>
  )
}
