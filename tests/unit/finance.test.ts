import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CURRENCY,
  formatMoney,
  isValidLocalDate,
  isValidMonth,
  isValidMoney,
  toMinorUnits,
} from '@/lib/finance'

describe('finance primitives', () => {
  it('defaults to INR and formats minor units as Indian Rupees', () => {
    expect(DEFAULT_CURRENCY).toBe('INR')
    expect(formatMoney(12_345)).toContain('₹')
    expect(toMinorUnits('123.45')).toBe(12_345)
  })

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN])(
    'rejects invalid transaction amount %s',
    (amount) => expect(isValidMoney(amount)).toBe(false),
  )

  it('accepts positive safe integer minor units', () => {
    expect(isValidMoney(1)).toBe(true)
    expect(isValidMoney(123_450)).toBe(true)
  })

  it('rejects amounts for an unsupported currency code without throwing', () => {
    expect(toMinorUnits('10', 'XXX')).toBeNull()
  })

  it('validates local dates and calendar months', () => {
    expect(isValidLocalDate('2026-10-21')).toBe(true)
    expect(isValidLocalDate('2026-02-29')).toBe(false)
    expect(isValidMonth('2026-10')).toBe(true)
    expect(isValidMonth('2026-13')).toBe(false)
  })
})
