import { describe, expect, it } from 'vitest'
import { createTask, type Task } from '@/lib/board'
import { STORAGE_KEY, loadBoard, loadTasks, saveTasks } from '@/lib/storage'

describe('storage', () => {
  it('round-trips tasks', () => {
    const tasks = [createTask({ title: 'A', deadline: null, description: '' }, 'tasks')]
    saveTasks(tasks)
    expect(loadTasks()).toEqual(tasks)
  })

  it('returns empty on missing data', () => {
    expect(loadTasks()).toEqual([])
  })

  it('returns empty on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{nope')
    expect(loadTasks()).toEqual([])
    expect(loadBoard().writable).toBe(false)
  })

  it('does not overwrite unsupported versions or malformed documents', () => {
    const unsupported = JSON.stringify({ version: 9, tasks: [] })
    localStorage.setItem(STORAGE_KEY, unsupported)
    expect(loadBoard()).toMatchObject({ writable: false, error: expect.any(String) })
    expect(localStorage.getItem(STORAGE_KEY)).toBe(unsupported)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: 'x' }))
    expect(loadTasks()).toEqual([])
    expect(loadBoard().writable).toBe(false)
  })

  it('migrates legacy tasks and assigns order by creation time with stable ties', () => {
    const newest = createTask({ title: 'Newest', deadline: null, description: '' }, 'tasks', 20)
    const oldest = createTask({ title: 'Oldest', deadline: null, description: '' }, 'tasks', 10)
    const tied = createTask({ title: 'Tied', deadline: null, description: '' }, 'tasks', 10)
    const legacyTask = (task: Task) => ({
      id: task.id,
      title: task.title,
      deadline: task.deadline,
      description: task.description,
      column: task.column,
      createdAt: task.createdAt,
    })
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        tasks: [legacyTask(newest), legacyTask(oldest), legacyTask(tied), { id: 1 }],
      }),
    )
    const migrated = loadBoard()
    expect(migrated.writable).toBe(true)
    expect(migrated.tasks.map((task) => [task.title, task.position])).toEqual([
      ['Newest', 2],
      ['Oldest', 0],
      ['Tied', 1],
    ])
    expect(migrated.tasks[0]).toMatchObject({ priority: null, labels: [], completed: false, archived: false })
  })

  it('round-trips version-2 task fields', () => {
    const task = { ...createTask({ title: 'Tagged', deadline: null, description: '' }, 'tasks'), priority: 'high' as const, labels: ['Work'], completed: true, archived: false, position: 2 }
    saveTasks([task])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(2)
    expect(loadTasks()).toEqual([task])
  })
})
