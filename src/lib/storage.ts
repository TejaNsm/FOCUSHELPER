import { DESCRIPTION_MAX, TITLE_MAX, isColumnId, type Task } from './board'

export const STORAGE_KEY = 'focushelper.board.v1'

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    t.title.trim().length > 0 &&
    t.title.length <= TITLE_MAX &&
    (t.deadline === null || (typeof t.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.deadline))) &&
    typeof t.description === 'string' &&
    t.description.length <= DESCRIPTION_MAX &&
    isColumnId(t.column) &&
    typeof t.createdAt === 'number'
  )
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return []
    const doc = data as { version?: unknown; tasks?: unknown }
    if (doc.version !== 1 || !Array.isArray(doc.tasks)) return []
    return doc.tasks.filter(isTask)
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks }))
  } catch {
    // Storage unavailable or full; the board keeps working in memory.
  }
}
