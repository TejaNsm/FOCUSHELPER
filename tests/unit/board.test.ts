import { describe, expect, it } from 'vitest'
import {
  boardReducer,
  createTask,
  isOverdue,
  tasksInColumn,
  validateTitle,
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
})
