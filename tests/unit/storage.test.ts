import { describe, expect, it } from 'vitest'
import { createTask } from '@/lib/board'
import { STORAGE_KEY, loadTasks, saveTasks } from '@/lib/storage'

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
  })

  it('returns empty on wrong version or shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tasks: [] }))
    expect(loadTasks()).toEqual([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: 'x' }))
    expect(loadTasks()).toEqual([])
  })

  it('drops invalid entries but keeps valid ones', () => {
    const good = createTask({ title: 'Good', deadline: null, description: '' }, 'tasks')
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, tasks: [good, { id: 1 }, { ...good, column: 'bogus' }] }),
    )
    expect(loadTasks()).toEqual([good])
  })
})
