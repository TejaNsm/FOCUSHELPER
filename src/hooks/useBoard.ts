import { useCallback, useEffect, useReducer, useState } from 'react'
import {
  boardReducer,
  columnLabel,
  createTask,
  type ColumnId,
  type TaskInput,
  type Task,
} from '@/lib/board'
import { loadBoard, saveTasks } from '@/lib/storage'

export function useBoard() {
  const [initial] = useState(loadBoard)
  const [tasks, dispatch] = useReducer(boardReducer, initial.tasks)
  const [status, setStatus] = useState('')
  const [storageError, setStorageError] = useState(initial.error)

  useEffect(() => {
    if (!initial.writable) return
    try {
      saveTasks(tasks)
      setStorageError(null)
    } catch {
      setStorageError('Changes could not be saved to browser storage. Check available storage and try again.')
    }
  }, [initial.writable, tasks])

  const addTask = useCallback((input: TaskInput, column: ColumnId) => {
    const task = createTask(input, column)
    dispatch({ type: 'add', task })
    setStatus(`Added "${task.title}" to ${columnLabel(column)}.`)
  }, [])

  const editTask = useCallback((id: string, input: TaskInput) => {
    dispatch({ type: 'edit', id, input })
    setStatus(`Updated "${input.title.trim()}".`)
  }, [])

  const removeTask = useCallback((task: Task) => {
    dispatch({ type: 'remove', id: task.id })
    setStatus(`Removed "${task.title}".`)
  }, [])

  const moveTask = useCallback((task: Task, column: ColumnId) => {
    if (task.column === column) return
    dispatch({ type: 'move', id: task.id, column })
    setStatus(`Moved "${task.title}" to ${columnLabel(column)}.`)
  }, [])

  const reorderTasks = useCallback((column: ColumnId, orderedVisibleIds: string[]) => {
    dispatch({ type: 'reorder', column, orderedVisibleIds })
    setStatus(`Reordered tasks in ${columnLabel(column)}.`)
  }, [])

  const setCompleted = useCallback((task: Task, completed: boolean) => {
    dispatch({ type: 'complete', id: task.id, completed })
    setStatus(`${completed ? 'Completed' : 'Reopened'} "${task.title}".`)
  }, [])

  const setArchived = useCallback((task: Task, archived: boolean) => {
    dispatch({ type: 'archive', id: task.id, archived })
    setStatus(`${archived ? 'Archived' : 'Restored'} "${task.title}".`)
  }, [])

  return {
    tasks,
    status,
    storageError,
    addTask,
    editTask,
    removeTask,
    moveTask,
    reorderTasks,
    setCompleted,
    setArchived,
  }
}
