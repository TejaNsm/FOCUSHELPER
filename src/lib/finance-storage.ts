import {
  emptyFinanceDocument,
  isValidFinanceDocument,
  type FinanceDocument,
  type FinanceLoadResult,
} from '@/lib/finance'

export const FINANCE_STORAGE_KEY = 'focushelper.finance.v1'

export function loadFinance(): FinanceLoadResult {
  let raw: string | null
  try {
    raw = localStorage.getItem(FINANCE_STORAGE_KEY)
  } catch {
    return {
      document: emptyFinanceDocument(),
      error: 'Saved finance data is unavailable because browser storage could not be read.',
      writable: false,
    }
  }
  if (raw === null) return { document: emptyFinanceDocument(), error: null, writable: true }

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { document: emptyFinanceDocument(), error: 'Saved finance data is corrupt. Existing data was left unchanged.', writable: false }
  }
  if (!value || typeof value !== 'object' || !('version' in value)) {
    return { document: emptyFinanceDocument(), error: 'Saved finance data has an unsupported format. Existing data was left unchanged.', writable: false }
  }

  const version = (value as { version?: unknown }).version
  if (version !== 1) {
    return {
      document: emptyFinanceDocument(),
      error: `Saved finance data uses unsupported version ${String(version)}. Existing data was left unchanged.`,
      writable: false,
    }
  }
  if (!isValidFinanceDocument(value)) {
    return { document: emptyFinanceDocument(), error: 'Saved finance data contains invalid records. Existing data was left unchanged.', writable: false }
  }
  return { document: value, error: null, writable: true }
}

export function saveFinance(document: FinanceDocument): void {
  if (!isValidFinanceDocument(document)) throw new Error('Finance data failed validation and was not saved.')
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(document))
}

export function validateFinanceBackup(value: unknown): FinanceDocument {
  if (!isValidFinanceDocument(value)) throw new Error('This finance backup is invalid or uses an unsupported version.')
  return value
}

export function parseFinanceBackup(text: string): FinanceDocument {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('The selected backup is not valid JSON.')
  }
  return validateFinanceBackup(value)
}
