import { describe, expect, it } from 'vitest'
import { goalProgress } from '@/lib/finance'
import { financeDocument } from './finance-fixtures'

describe('savings goal calculations', () => {
  const goal = { id: 'home', name: 'Home', targetMinor: 120_000, currency: 'INR', targetDate: '2026-12-15', createdAt: 1, archived: false }

  it('shows remaining amount and monthly contribution across calendar months', () => {
    const result = goalProgress({ ...financeDocument, goalAllocations: [{ id: 'a', goalId: goal.id, amountMinor: 30_000, date: '2026-10-01' }] }, goal, '2026-10-21')
    expect(result).toMatchObject({ allocatedMinor: 30_000, remainingMinor: 90_000, requiredMonthlyMinor: 30_000 })
  })

  it('caps progress and never shows negative remaining amount', () => {
    const result = goalProgress({ ...financeDocument, goalAllocations: [{ id: 'a', goalId: goal.id, amountMinor: 130_000, date: '2026-10-01' }] }, goal, '2026-10-21')
    expect(result).toMatchObject({ remainingMinor: 0, progress: 1, requiredMonthlyMinor: null })
  })

  it('omits required contribution when no target date is set', () => {
    expect(goalProgress(financeDocument, { ...goal, targetDate: undefined }, '2026-10-21').requiredMonthlyMinor).toBeNull()
  })
})
