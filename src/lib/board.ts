export type ColumnId = 'tasks' | 'meetings' | 'backburner'

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'backburner', label: 'Backburner' },
]

export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 500

export interface Task {
  id: string
  title: string
  deadline: string | null
  description: string
  column: ColumnId
  createdAt: number
}

export interface TaskInput {
  title: string
  deadline: string | null
  description: string
}

export type Action =
  | { type: 'add'; task: Task }
  | { type: 'edit'; id: string; input: TaskInput }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; column: ColumnId }

export function columnLabel(id: ColumnId): string {
  return COLUMNS.find((c) => c.id === id)?.label ?? id
}

export function isColumnId(value: unknown): value is ColumnId {
  return COLUMNS.some((c) => c.id === value)
}

export function validateTitle(title: string): string | null {
  const trimmed = title.trim()
  if (!trimmed) return 'Title is required.'
  if (trimmed.length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`
  return null
}

export function normalizeInput(input: TaskInput): TaskInput {
  return {
    title: input.title.trim(),
    deadline: input.deadline ? input.deadline : null,
    description: input.description.trim().slice(0, DESCRIPTION_MAX),
  }
}

export function createTask(input: TaskInput, column: ColumnId, now = Date.now()): Task {
  return {
    ...normalizeInput(input),
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`,
    column,
    createdAt: now,
  }
}

export function boardReducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'add':
      return [...tasks, action.task]
    case 'edit':
      return tasks.map((t) => (t.id === action.id ? { ...t, ...normalizeInput(action.input) } : t))
    case 'remove':
      return tasks.filter((t) => t.id !== action.id)
    case 'move': {
      const task = tasks.find((t) => t.id === action.id)
      if (!task || task.column === action.column) return tasks
      return tasks.map((t) => (t.id === action.id ? { ...t, column: action.column } : t))
    }
  }
}

export function tasksInColumn(tasks: Task[], column: ColumnId): Task[] {
  return tasks.filter((t) => t.column === column).sort((a, b) => a.createdAt - b.createdAt)
}

export function localToday(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

export function isOverdue(deadline: string | null, today = localToday()): boolean {
  return !!deadline && deadline < today
}

export function formatDeadline(deadline: string): string {
  const [y, m, d] = deadline.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
