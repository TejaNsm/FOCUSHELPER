import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { goalProgress, formatMoney, fromMinorUnits, localToday, toMinorUnits, type FinanceDocument, type GoalAllocation, type SavingsGoal } from '@/lib/finance'

interface GoalsProps {
  document: FinanceDocument
  onSaveGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => void
  onSaveAllocation: (allocation: Omit<GoalAllocation, 'id'>) => void
  onDeleteAllocation: (id: string) => void
  onArchiveGoal: (goal: SavingsGoal) => void
}

export function Goals({ document, onSaveGoal, onSaveAllocation, onDeleteAllocation, onArchiveGoal }: GoalsProps) {
  const [editingId, setEditingId] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [plannedMonthly, setPlannedMonthly] = useState('')
  const [allocationGoal, setAllocationGoal] = useState('')
  const [allocation, setAllocation] = useState('')
  const [error, setError] = useState('')

  function createGoal(event: FormEvent) {
    event.preventDefault()
    const targetMinor = toMinorUnits(target, currency)
    if (!name.trim() || !targetMinor) return setError('Enter a goal name and target amount greater than zero.')
    const plannedMonthlyMinor = plannedMonthly ? toMinorUnits(plannedMonthly, currency) : undefined
    if (plannedMonthly && !plannedMonthlyMinor) return setError('Enter a valid planned monthly contribution.')
    const existing = document.goals.find((goal) => goal.id === editingId)
    onSaveGoal({ id: editingId, createdAt: existing?.createdAt, name: name.trim(), targetMinor, currency, targetDate: targetDate || undefined, plannedMonthlyMinor: plannedMonthlyMinor ?? undefined, archived: false })
    setEditingId(undefined)
    setName('')
    setTarget('')
    setTargetDate('')
    setPlannedMonthly('')
    setError('')
  }

  function allocate(event: FormEvent) {
    event.preventDefault()
    const goal = document.goals.find((item) => item.id === allocationGoal)
    const amountMinor = goal ? toMinorUnits(allocation, goal.currency) : null
    if (!goal || !amountMinor) return setError('Choose a goal and enter an allocation greater than zero.')
    onSaveAllocation({ goalId: goal.id, amountMinor, date: localToday() })
    setAllocation('')
    setError('')
  }

  return (
    <section aria-labelledby="goals-heading" className="grid gap-4">
      <div><h2 id="goals-heading" className="text-xl font-bold">Savings goals</h2><p className="text-sm text-muted-foreground">Allocations are planning records; they do not move money between accounts.</p></div>
      {error && <p role="alert" className="rounded border-2 border-destructive p-2 text-sm">{error}</p>}
      <form onSubmit={createGoal} className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5"><Label htmlFor="goal-name">Goal name</Label><Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="goal-target">Target amount</Label><Input id="goal-target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required /></div>
        <div className="grid gap-1.5"><Label htmlFor="goal-currency">Currency</Label><Input id="goal-currency" value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
        <div className="grid gap-1.5"><Label htmlFor="goal-date">Target date (optional)</Label><Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="goal-planned-monthly">Planned monthly contribution (optional)</Label><Input id="goal-planned-monthly" inputMode="decimal" value={plannedMonthly} onChange={(e) => setPlannedMonthly(e.target.value)} /></div>
        <Button type="submit" className="min-h-11 sm:col-span-2 lg:col-span-4">{editingId ? 'Save goal changes' : 'Create goal'}</Button>
      </form>
      <form onSubmit={allocate} className="grid gap-3 rounded border-2 border-[var(--ink)] bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="grid gap-1.5"><Label htmlFor="allocation-goal">Goal</Label><select id="allocation-goal" className="h-11 rounded border-2 bg-background px-3" value={allocationGoal} onChange={(e) => setAllocationGoal(e.target.value)}><option value="">Choose goal</option>{document.goals.filter((goal) => !goal.archived).map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></div>
        <div className="grid gap-1.5"><Label htmlFor="allocation-amount">Allocate amount</Label><Input id="allocation-amount" inputMode="decimal" value={allocation} onChange={(e) => setAllocation(e.target.value)} /></div>
        <div className="flex items-end"><Button className="min-h-11" variant="outline" type="submit">Allocate</Button></div>
      </form>
      {document.goals.filter((goal) => !goal.archived).length ? <ul className="grid gap-3 md:grid-cols-2">{document.goals.filter((goal) => !goal.archived).map((goal) => {
        const progress = goalProgress(document, goal)
        return <li key={goal.id} className="grid gap-2 rounded border-2 border-[var(--ink)] bg-card p-4"><div className="flex justify-between gap-2"><h3 className="font-bold">{goal.name}</h3><span>{Math.round(progress.progress * 100)}%</span></div><progress aria-label={`${goal.name} progress`} max="1" value={progress.progress} className="h-4 w-full accent-primary" /><p>Saved {formatMoney(progress.allocatedMinor, goal.currency)} of {formatMoney(goal.targetMinor, goal.currency)}</p><p>Remaining: {formatMoney(progress.remainingMinor, goal.currency)}</p>{goal.targetDate && <p>Target date: {goal.targetDate}</p>}{goal.plannedMonthlyMinor && <p>Planned monthly contribution: {formatMoney(goal.plannedMonthlyMinor, goal.currency)}</p>}{progress.requiredMonthlyMinor !== null && <p>Required monthly contribution: {formatMoney(progress.requiredMonthlyMinor, goal.currency)}</p>}{document.goalAllocations.filter((item) => item.goalId === goal.id).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm"><span>{formatMoney(item.amountMinor, goal.currency)} · {item.date}</span><Button type="button" variant="outline" className="min-h-11" aria-label={`Remove allocation ${formatMoney(item.amountMinor, goal.currency)} from ${goal.name}`} onClick={() => onDeleteAllocation(item.id)}>Remove</Button></div>)}<div className="flex gap-2"><Button type="button" variant="outline" className="min-h-11" onClick={() => { setEditingId(goal.id); setName(goal.name); setTarget(String(fromMinorUnits(goal.targetMinor, goal.currency))); setCurrency(goal.currency); setTargetDate(goal.targetDate ?? ''); setPlannedMonthly(goal.plannedMonthlyMinor ? String(fromMinorUnits(goal.plannedMonthlyMinor, goal.currency)) : '') }}>Edit</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => onArchiveGoal({ ...goal, archived: true })}>Archive</Button></div></li>
      })}</ul> : <p className="rounded border border-dashed p-5 text-muted-foreground">No goals yet. Create a savings goal to track progress.</p>}
      {document.goals.some((goal) => goal.archived) && <section aria-label="Archived goals" className="grid gap-2"><h3 className="font-semibold">Archived goals</h3>{document.goals.filter((goal) => goal.archived).map((goal) => <div key={goal.id} className="flex items-center justify-between gap-2 rounded border p-3"><span>{goal.name}</span><Button type="button" variant="outline" className="min-h-11" onClick={() => onSaveGoal({ ...goal, archived: false })}>Restore</Button></div>)}</section>}
    </section>
  )
}
