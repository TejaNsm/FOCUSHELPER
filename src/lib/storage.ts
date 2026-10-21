import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  isColumnId,
  normalizeLabels,
  type Priority,
  type Task,
} from './board'

export const STORAGE_KEY = 'focushelper.board.v1'
export const STORAGE_VERSION = 2

export interface BoardLoadResult {
  tasks: Task[]
  error: string | null
  writable: boolean
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isLegacyTask(value: unknown): value is Omit<Task, 'priority' | 'labels' | 'completed' | 'archived' | 'position'> {
  if (!value || typeof value !== 'object') return false
  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    task.title.trim().length > 0 &&
    task.title.length <= TITLE_MAX &&
    (task.deadline === null || (typeof task.deadline === 'string' && isValidDate(task.deadline))) &&
    typeof task.description === 'string' &&
    task.description.length <= DESCRIPTION_MAX &&
    isColumnId(task.column) &&
    typeof task.createdAt === 'number' &&
    Number.isFinite(task.createdAt)
  )
}

function isPriority(value: unknown): value is Priority | null {
  return value === null || value === 'low' || value === 'medium' || value === 'high'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0)
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  if (!isLegacyTask(value)) return false
  const valueRecord = value as Record<string, unknown>
  return (
    isPriority(valueRecord.priority) &&
    isStringArray(valueRecord.labels) &&
    valueRecord.labels.every((label) => label === label.trim()) &&
    normalizeLabels(valueRecord.labels).length === valueRecord.labels.length &&
    typeof valueRecord.completed === 'boolean' &&
    typeof valueRecord.archived === 'boolean' &&
    typeof valueRecord.position === 'number' &&
    Number.isFinite(valueRecord.position) &&
    valueRecord.position >= 0
  )
}

function isTaskArray(value: unknown): value is Task[] {
  if (!Array.isArray(value) || !value.every(isTask)) return false
  return new Set(value.map((task) => task.id)).size === value.length
}

function migrateLegacyTasks(values: unknown[]): Task[] {
  const tasks = values.filter(isLegacyTask).map((task) => ({
    ...task,
    priority: null,
    labels: [],
    completed: false,
    archived: false,
    position: 0,
  }))
  const positions = new Map<string, number>()
  for (const column of ['tasks', 'meetings', 'backburner'] as const) {
    tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task.column === column)
      .sort((a, b) => a.task.createdAt - b.task.createdAt || a.index - b.index)
      .forEach(({ task }, position) => positions.set(task.id, position))
  }
  return tasks.map((task) => ({ ...task, position: positions.get(task.id) ?? 0 }))
}

export function loadBoard(): BoardLoadResult {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { tasks: [], error: 'Saved tasks are unavailable because browser storage could not be read.', writable: false }
  }
  if (raw === null) return { tasks: [], error: null, writable: true }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { tasks: [], error: 'Saved tasks could not be read. Existing data was left unchanged.', writable: false }
  }
  if (!data || typeof data !== 'object') {
    return { tasks: [], error: 'Saved tasks have an unsupported format. Existing data was left unchanged.', writable: false }
  }

  const document = data as { version?: unknown; tasks?: unknown }
  if (!Array.isArray(document.tasks)) {
    return { tasks: [], error: 'Saved tasks have an unsupported format. Existing data was left unchanged.', writable: false }
  }
  if (document.version === 1) {
    return { tasks: migrateLegacyTasks(document.tasks), error: null, writable: true }
  }
  if (document.version === STORAGE_VERSION) {
    if (!isTaskArray(document.tasks)) {
      return { tasks: [], error: 'Saved tasks contain invalid data. Existing data was left unchanged.', writable: false }
    }
    return { tasks: document.tasks, error: null, writable: true }
  }
  return {
    tasks: [],
    error: `Saved tasks use unsupported version ${String(document.version)}. Existing data was left unchanged.`,
    writable: false,
  }
}

export function loadTasks(): Task[] {
  return loadBoard().tasks
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, tasks }))
}
