import { describe, expect, it } from 'vitest'
import {
  boardReducer,
  createTask,
  filterTasks,
  isOverdue,
  normalizeLabels,
  sortTasks,
  tasksInColumn,
  validateTitle,
  type TaskFilters,
  type Task,
} from '@/lib/board'

const input = { title: '  Pay rent  ', deadline: '2026-11-01', description: ' monthly ' }

describe('validateTitle', () => {
  it('rejects empty and whitespace-only titles', () => {
    expect(validateTitle('')).toBeTruthy()
    expect(validateTitle('   ')).toBeTruthy()
  })
  it('rejects titles over 120 characters', () => {
    expect(validateTitle('a'.repeat(121))).toBeTruthy()
    expect(validateTitle('a'.repeat(120))).toBeNull()
  })
})

describe('normalizeLabels', () => {
  it('trims labels and removes duplicates ignoring case and whitespace', () => {
    expect(normalizeLabels([' Work ', 'work', 'HOME', ' home ', ''])).toEqual(['Work', 'HOME'])
  })
})

describe('reducer', () => {
  it('adds a trimmed task in the chosen column', () => {
    const task = createTask(input, 'meetings', 1)
    const state = boardReducer([], { type: 'add', task })
    expect(state).toHaveLength(1)
    expect(state[0]).toMatchObject({ title: 'Pay rent', description: 'monthly', column: 'meetings' })
  })

  it('edits fields but keeps column and createdAt', () => {
    const task = createTask(input, 'meetings', 5)
    const state = boardReducer([task], {
      type: 'edit',
      id: task.id,
      input: { title: 'New', deadline: null, description: '' },
    })
    expect(state[0]).toMatchObject({ title: 'New', deadline: null, column: 'meetings', createdAt: 5 })
  })

  it('removes a task', () => {
    const task = createTask(input, 'tasks')
    expect(boardReducer([task], { type: 'remove', id: task.id })).toEqual([])
  })

  it('moves a task and treats same-column move as a no-op', () => {
    const task = createTask(input, 'tasks')
    const moved = boardReducer([task], { type: 'move', id: task.id, column: 'backburner' })
    expect(moved[0].column).toBe('backburner')
    const initial = [task]
    expect(boardReducer(initial, { type: 'move', id: task.id, column: 'tasks' })).toBe(initial)
  })

  it('reorders only visible positions and preserves hidden task order', () => {
    const tasks = ['a', 'hidden-1', 'b', 'hidden-2', 'c'].map((title, position) => ({
      ...createTask({ ...input, title }, 'tasks', position),
      position,
    }))
    const reordered = boardReducer(tasks, {
      type: 'reorder',
      column: 'tasks',
      orderedVisibleIds: [tasks[2].id, tasks[0].id, tasks[4].id],
    })
    expect(tasksInColumn(reordered, 'tasks').map((task) => task.title)).toEqual([
      'b',
      'hidden-1',
      'a',
      'hidden-2',
      'c',
    ])
  })

  it('keeps completion independent from archive state', () => {
    const task = createTask(input, 'tasks')
    const completed = boardReducer([task], { type: 'complete', id: task.id, completed: true })
    expect(completed[0]).toMatchObject({ completed: true, archived: false })
    const archived = boardReducer(completed, { type: 'archive', id: task.id, archived: true })
    expect(archived[0]).toMatchObject({ completed: true, archived: true })
    expect(boardReducer(archived, { type: 'archive', id: task.id, archived: false })[0].completed).toBe(true)
  })
})

describe('ordering and overdue', () => {
  it('orders by createdAt ascending within a column', () => {
    const a: Task = { ...createTask(input, 'tasks', 20), title: 'a' }
    const b: Task = { ...createTask(input, 'tasks', 10), title: 'b' }
    const c: Task = { ...createTask(input, 'meetings', 5), title: 'c' }
    expect(tasksInColumn([a, b, c], 'tasks').map((t) => t.title)).toEqual(['b', 'a'])
  })

  it('flags only past deadlines', () => {
    expect(isOverdue('2026-10-20', '2026-10-21')).toBe(true)
    expect(isOverdue('2026-10-21', '2026-10-21')).toBe(false)
    expect(isOverdue(null, '2026-10-21')).toBe(false)
  })

  it('filters by local deadline state, text, and active/archive status', () => {
    const tasks = [
      createTask({ ...input, title: 'Late', deadline: '2026-10-20', description: '' }, 'tasks', 1),
      createTask({ ...input, title: 'Today', deadline: '2026-10-21', description: 'needle' }, 'meetings', 2),
      createTask({ ...input, title: 'Later', deadline: '2026-10-22', description: '' }, 'backburner', 3),
      createTask({ ...input, title: 'No date', deadline: null, description: '' }, 'tasks', 4),
    ]
    const filters: TaskFilters = {
      query: ' NEEDLE ',
      column: '',
      deadlineState: 'due-today' as const,
      priority: '',
      label: '',
      status: 'active' as const,
    }
    expect(filterTasks(tasks, filters, 'board', '2026-10-21').map((task) => task.title)).toEqual(['Today'])
    expect(filterTasks(tasks, { ...filters, deadlineState: '' }, 'upcoming', '2026-10-21')).toEqual([])
  })

  it('keeps undated tasks last in both deadline sort directions and stabilizes ties', () => {
    const tasks = [
      createTask({ ...input, title: 'b', deadline: '2026-10-22' }, 'tasks', 1),
      createTask({ ...input, title: 'a', deadline: '2026-10-22' }, 'tasks', 2),
      createTask({ ...input, title: 'none', deadline: null }, 'tasks', 3),
    ]
    expect(sortTasks(tasks, 'deadline', 'asc').map((task) => task.title)).toEqual(['b', 'a', 'none'])
    expect(sortTasks(tasks, 'deadline', 'desc').map((task) => task.title)).toEqual(['b', 'a', 'none'])
    expect(sortTasks(tasks, 'title', 'asc').map((task) => task.title)).toEqual(['a', 'b', 'none'])
  })
})
