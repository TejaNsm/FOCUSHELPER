import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Accounts } from '@/components/finance/Accounts'
import { Budget } from '@/components/finance/Budget'
import { Goals } from '@/components/finance/Goals'
import { LoansDebt } from '@/components/finance/LoansDebt'
import { Overview } from '@/components/finance/Overview'
import { Reports } from '@/components/finance/Reports'
import { Transactions } from '@/components/finance/Transactions'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/hooks/useFinance'
import { parseFinanceBackup } from '@/lib/finance-storage'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type FinanceView = 'overview' | 'transactions' | 'accounts' | 'budget' | 'goals' | 'debt' | 'reports'

const views: { id: FinanceView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'budget', label: 'Budget' },
  { id: 'goals', label: 'Goals' },
  { id: 'debt', label: 'Loans & Debt' },
  { id: 'reports', label: 'Reports' },
]

export function FinanceWorkspace() {
  const finance = useFinance()
  const [view, setView] = useState<FinanceView>('overview')
  const [recoveryError, setRecoveryError] = useState('')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const { document } = finance

  function handleViewKey(event: KeyboardEvent<HTMLButtonElement>) {
    const current = views.findIndex(({ id }) => id === view)
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : (current + direction + views.length) % views.length
    if (!direction && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    setView(views[target].id)
    tabRefs.current[target]?.focus()
  }

  async function recoverBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = parseFinanceBackup(await file.text())
      if (window.confirm('Import this valid backup and replace saved finance data? Task Board data will not change.')) {
        finance.importDocument(parsed)
        setRecoveryError('')
      }
    } catch (cause) {
      setRecoveryError(cause instanceof Error ? cause.message : 'The backup could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6">
      <header><h1 className="retro-title text-2xl font-black sm:text-3xl">Personal Finance</h1><p className="mt-2 text-sm">Private, browser-local finance tracking. This data is not encrypted or backed up automatically and can be lost if browser data is cleared.</p></header>
      <p role="status" aria-live="polite" className="sr-only">{finance.status}</p>
      {finance.storageError && <p role="alert" className="rounded-md border-2 border-destructive p-3">{finance.storageError}</p>}
      {!finance.writable && <p role="alert" className="rounded-md border-2 border-destructive p-3">Finance editing is disabled until saved data can be safely read. Existing data has not been overwritten.</p>}
      <nav role="tablist" aria-label="Personal Finance views" className="flex flex-wrap gap-2">
        {views.map(({ id, label }, index) => <Button key={id} ref={(node) => { tabRefs.current[index] = node }} role="tab" id={`finance-tab-${id}`} aria-selected={view === id} aria-controls={`finance-panel-${id}`} tabIndex={view === id ? 0 : -1} variant={view === id ? 'default' : 'outline'} className="min-h-11" onClick={() => setView(id)} onKeyDown={handleViewKey}>{label}</Button>)}
      </nav>
      <section role="tabpanel" id={`finance-panel-${view}`} aria-labelledby={`finance-tab-${view}`} className="min-w-0">
        {!finance.writable && view !== 'overview' && <div className="grid gap-3"><p role="status">This finance view is read-only because saved data could not be safely loaded.</p><div className="grid gap-2 rounded border-2 border-destructive bg-card p-4"><h2 className="font-semibold">Restore from a valid finance backup</h2><p className="text-sm">Import validates the entire file and replaces finance data only after confirmation. Task Board data is not changed.</p>{recoveryError && <p role="alert">{recoveryError}</p>}<Label htmlFor="finance-recovery-file">Finance backup file</Label><Input id="finance-recovery-file" type="file" accept="application/json,.json" onChange={recoverBackup} /></div></div>}
        {finance.writable && view === 'transactions' && <Transactions transactions={document.transactions} accounts={document.accounts} categories={document.categories} onSave={finance.saveTransaction} onDelete={finance.deleteTransaction} />}
        {finance.writable && view === 'accounts' && <Accounts accounts={document.accounts} categories={document.categories} onSaveAccount={finance.saveAccount} onSaveCategory={finance.saveCategory} onArchiveAccount={finance.archiveAccount} onArchiveCategory={finance.archiveCategory} />}
        {finance.writable && view === 'budget' && <Budget document={document} onSaveBudget={finance.saveBudget} onSaveRecurring={finance.saveRecurringItem} onConfirmRecurring={finance.confirmRecurringItem} onSkipRecurring={finance.skipRecurringItem} />}
        {finance.writable && view === 'goals' && <Goals document={document} onSaveGoal={finance.saveGoal} onSaveAllocation={finance.saveAllocation} onDeleteAllocation={finance.deleteAllocation} onArchiveGoal={finance.archiveGoal} />}
        {finance.writable && view === 'debt' && <LoansDebt debts={document.debts} payments={document.debtPayments} accounts={document.accounts} onSave={finance.saveDebt} onRecordPayment={finance.recordDebtPayment} onDeletePayment={finance.deleteDebtPayment} />}
        {finance.writable && view === 'reports' && <Reports document={document} onSaveSnapshot={finance.saveSnapshot} onImport={finance.importDocument} announce={finance.announce} />}
        {view === 'overview' && <Overview document={document} />}
      </section>
      <footer className="border-t pt-3 text-xs text-muted-foreground">No bank connections, telemetry, or external financial services. This app does not provide professional financial advice.</footer>
    </main>
  )
}
