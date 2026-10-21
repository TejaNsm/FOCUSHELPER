export type ColumnId = 'tasks' | 'meetings' | 'backburner'

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'backburner', label: 'Backburner' },
]

export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 500

export type Priority = 'low' | 'medium' | 'high'
export type DeadlineState = 'overdue' | 'due-today' | 'upcoming' | 'no-deadline'
export type SortField = 'deadline' | 'createdAt' | 'title'
export type TaskView = 'board' | 'due-today' | 'upcoming'

export interface Task {
  id: string
  title: string
  deadline: string | null
  description: string
  column: ColumnId
  createdAt: number
  priority: Priority | null
  labels: string[]
  completed: boolean
  archived: boolean
  position: number
}

export interface TaskInput {
  title: string
  deadline: string | null
  description: string
  priority?: Priority | null
  labels?: string[]
}

export interface NormalizedTaskInput {
  title: string
  deadline: string | null
  description: string
  priority: Priority | null
  labels: string[]
}

export type Action =
  | { type: 'add'; task: Task }
  | { type: 'edit'; id: string; input: TaskInput }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; column: ColumnId }
  | { type: 'reorder'; column: ColumnId; orderedVisibleIds: string[] }
  | { type: 'complete'; id: string; completed: boolean }
  | { type: 'archive'; id: string; archived: boolean }

export interface TaskFilters {
  query: string
  column: ColumnId | ''
  deadlineState: DeadlineState | ''
  priority: Priority | ''
  label: string
  status: 'active' | 'archived'
}

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

export function normalizeLabels(labels: string[]): string[] {
  const seen = new Set<string>()
  return labels.reduce<string[]>((normalized, value) => {
    const label = value.trim()
    const key = label.toLocaleLowerCase()
    if (label && !seen.has(key)) {
      seen.add(key)
      normalized.push(label)
    }
    return normalized
  }, [])
}

export function normalizeInput(input: TaskInput): NormalizedTaskInput {
  return {
    title: input.title.trim(),
    deadline: input.deadline ? input.deadline : null,
    description: input.description.trim().slice(0, DESCRIPTION_MAX),
    priority: input.priority ?? null,
    labels: normalizeLabels(input.labels ?? []),
  }
}

export function createTask(input: TaskInput, column: ColumnId, now = Date.now()): Task {
  const normalized = normalizeInput(input)
  return {
    ...normalized,
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`,
    column,
    createdAt: now,
    completed: false,
    archived: false,
    position: 0,
  }
}

export function boardReducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'add':
      return [
        ...tasks,
        {
          ...action.task,
          position:
            Math.max(-1, ...tasks.filter((task) => task.column === action.task.column).map((task) => task.position)) +
            1,
        },
      ]
    case 'edit':
      return tasks.map((t) => (t.id === action.id ? { ...t, ...normalizeInput(action.input) } : t))
    case 'remove':
      return tasks.filter((t) => t.id !== action.id)
    case 'move': {
      const task = tasks.find((t) => t.id === action.id)
      if (!task || task.column === action.column) return tasks
      const source = tasksInColumn(tasks, task.column).filter((item) => item.id !== task.id)
      const destination = tasksInColumn(tasks, action.column)
      return tasks.map((item) => {
        if (item.id === task.id) return { ...item, column: action.column, position: destination.length }
        if (item.column === task.column) {
          return { ...item, position: source.findIndex((sourceItem) => sourceItem.id === item.id) }
        }
        return item
      })
    }
    case 'reorder': {
      const columnTasks = tasksInColumn(tasks, action.column)
      const columnIds = new Set(columnTasks.map((task) => task.id))
      const visibleIds = [...new Set(action.orderedVisibleIds.filter((id) => columnIds.has(id)))]
      if (visibleIds.length < 2) return tasks
      let visibleIndex = 0
      const reorderedIds = new Set(visibleIds)
      const order = columnTasks.map((task) =>
        reorderedIds.has(task.id) ? visibleIds[visibleIndex++] : task.id,
      )
      if (order.every((id, index) => id === columnTasks[index].id)) return tasks
      const positions = new Map(order.map((id, position) => [id, position]))
      return tasks.map((task) =>
        task.column === action.column ? { ...task, position: positions.get(task.id) ?? task.position } : task,
      )
    }
    case 'complete':
      return tasks.map((task) =>
        task.id === action.id ? { ...task, completed: action.completed } : task,
      )
    case 'archive':
      return tasks.map((task) => (task.id === action.id ? { ...task, archived: action.archived } : task))
  }
}

export function tasksInColumn(tasks: Task[], column: ColumnId): Task[] {
  return tasks
    .filter((task) => task.column === column)
    .sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
}

export function localToday(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

export function isOverdue(deadline: string | null, today = localToday()): boolean {
  return !!deadline && deadline < today
}

export function getDeadlineState(deadline: string | null, today = localToday()): DeadlineState {
  if (!deadline) return 'no-deadline'
  if (deadline < today) return 'overdue'
  if (deadline === today) return 'due-today'
  return 'upcoming'
}

export function filterTasks(
  tasks: Task[],
  filters: TaskFilters,
  view: TaskView = 'board',
  today = localToday(),
): Task[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return tasks.filter((task) => {
    if (task.archived !== (filters.status === 'archived')) return false
    if (filters.column && task.column !== filters.column) return false
    if (filters.deadlineState && getDeadlineState(task.deadline, today) !== filters.deadlineState) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (
      filters.label &&
      !task.labels.some((label) => label.toLocaleLowerCase() === filters.label.toLocaleLowerCase())
    ) {
      return false
    }
    if (query && !`${task.title}\n${task.description}`.toLocaleLowerCase().includes(query)) return false
    if (view === 'due-today' && getDeadlineState(task.deadline, today) !== 'due-today') return false
    if (view === 'upcoming' && getDeadlineState(task.deadline, today) !== 'upcoming') return false
    return true
  })
}

export function sortTasks(tasks: Task[], field: SortField | '', direction: 'asc' | 'desc'): Task[] {
  if (!field) return [...tasks].sort((a, b) => a.position - b.position || a.createdAt - b.createdAt)
  return tasks
    .map((task, index) => ({ task, index }))
    .sort(({ task: a, index: ai }, { task: b, index: bi }) => {
      if (field === 'deadline') {
        if (a.deadline === null && b.deadline !== null) return 1
        if (a.deadline !== null && b.deadline === null) return -1
      }
      const comparison =
        field === 'title'
          ? a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
          : field === 'createdAt'
            ? a.createdAt - b.createdAt
            : (a.deadline ?? '').localeCompare(b.deadline ?? '')
      return comparison === 0 ? ai - bi : comparison * (direction === 'asc' ? 1 : -1)
    })
    .map(({ task }) => task)
}

export function formatDeadline(deadline: string): string {
  const [y, m, d] = deadline.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
