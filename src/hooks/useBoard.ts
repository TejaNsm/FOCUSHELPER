import { useCallback, useEffect, useReducer, useState } from 'react'
import {
  boardReducer,
  columnLabel,
  createTask,
  type ColumnId,
  type TaskInput,
  type Task,
} from '@/lib/board'
import { loadTasks, saveTasks } from '@/lib/storage'

export function useBoard() {
  const [tasks, dispatch] = useReducer(boardReducer, undefined, loadTasks)
  const [status, setStatus] = useState('')

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

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

  return { tasks, status, addTask, editTask, removeTask, moveTask }
}
