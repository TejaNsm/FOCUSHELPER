import { useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type PointerSensorOptions,
  type ScreenReaderInstructions,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Column } from '@/components/Column'
import { DeleteDialog } from '@/components/DeleteDialog'
import { TaskCardBody } from '@/components/TaskCard'
import { TaskDialog, type DialogState } from '@/components/TaskDialog'
import { useBoard } from '@/hooks/useBoard'
import {
  COLUMNS,
  columnLabel,
  filterTasks,
  isColumnId,
  sortTasks,
  tasksInColumn,
  type ColumnId,
  type DeadlineState,
  type Priority,
  type SortField,
  type Task,
  type TaskFilters,
  type TaskView,
} from '@/lib/board'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const defaultFilters: TaskFilters = {
  query: '',
  column: '',
  deadlineState: '',
  priority: '',
  label: '',
  status: 'active',
}

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    'Press space or enter to pick up a task. Use the up and down arrow keys to reorder it within its column, or left and right to choose another column. Press space or enter to drop it, or escape to cancel.',
}

const keyboardColumn = { current: 0 }

const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
    return sortableKeyboardCoordinates(event, args)
  }
  if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return undefined
  event.preventDefault()

  const nextIndex = Math.min(
    COLUMNS.length - 1,
    Math.max(0, keyboardColumn.current + (event.code === 'ArrowRight' ? 1 : -1)),
  )
  if (nextIndex === keyboardColumn.current) return undefined
  const currentColumn = document.querySelector(`[data-column="${COLUMNS[keyboardColumn.current].id}"]`)
  const nextColumn = document.querySelector(`[data-column="${COLUMNS[nextIndex].id}"]`)
  const from = currentColumn?.getBoundingClientRect()
  const to = nextColumn?.getBoundingClientRect()
  if (!from || !to) return undefined

  keyboardColumn.current = nextIndex
  return {
    x: args.currentCoordinates.x + to.left + to.width / 2 - (from.left + from.width / 2),
    y: args.currentCoordinates.y + to.top + to.height / 2 - (from.top + from.height / 2),
  }
}

// Touch input uses a press-and-hold sensor so ordinary swipes continue to scroll.
class MouseAndPenSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }, { onActivation }: PointerSensorOptions) => {
        if (nativeEvent.pointerType === 'touch' || !nativeEvent.isPrimary || nativeEvent.button !== 0) {
          return false
        }
        onActivation?.({ event: nativeEvent })
        return true
      },
    },
  ]
}

const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  return within.length > 0 ? within : closestCenter(args)
}

export function Board() {
  const {
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
  } = useBoard()
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [view, setView] = useState<TaskView>('board')
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)
  const [sortField, setSortField] = useState<SortField | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sensors = useSensors(
    useSensor(MouseAndPenSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  )

  const byId = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])
  const activeTask = activeId ? (byId.get(activeId) ?? null) : null
  const labels = useMemo(() => {
    const unique = new Map<string, string>()
    tasks.forEach((task) => {
      task.labels.forEach((label) => unique.set(label.toLocaleLowerCase(), label))
    })
    return [...unique.values()].sort((a, b) => a.localeCompare(b))
  }, [tasks])
  const matchingTasks = useMemo(() => filterTasks(tasks, filters, view), [filters, tasks, view])
  const visibleByColumn = useMemo(
    () =>
      new Map(
        COLUMNS.map(({ id }) => [
          id,
          sortTasks(tasksInColumn(matchingTasks, id), sortField, sortDirection),
        ]),
      ),
    [matchingTasks, sortDirection, sortField],
  )

  const titleOf = (id: string | number) => byId.get(String(id))?.title ?? 'task'
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up "${titleOf(active.id)}" to reorder.`,
    onDragOver: ({ active, over }) => {
      if (!over) return undefined
      const targetTask = byId.get(String(over.id))
      const targetColumn = isColumnId(String(over.id)) ? String(over.id) as ColumnId : targetTask?.column
      if (!targetColumn) return undefined
      const columnTasks = visibleByColumn.get(targetColumn) ?? []
      const position = targetTask ? columnTasks.findIndex((task) => task.id === targetTask.id) + 1 : columnTasks.length
      return `"${titleOf(active.id)}" is over position ${position} in ${columnLabel(targetColumn)}.`
    },
    onDragEnd: ({ active, over }) =>
      over ? `Dropped "${titleOf(active.id)}".` : `Dropped "${titleOf(active.id)}" without moving it.`,
    onDragCancel: ({ active }) => `Cancelled. "${titleOf(active.id)}" was not moved.`,
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    setActiveId(id)
    keyboardColumn.current = Math.max(
      0,
      COLUMNS.findIndex((column) => column.id === byId.get(id)?.column),
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const task = byId.get(String(event.active.id))
    if (!task || !event.over) return
    const targetId = String(event.over.id)
    const targetTask = byId.get(targetId)
    const keyboardDrop = event.activatorEvent instanceof KeyboardEvent
    const targetColumn = keyboardDrop ? COLUMNS[keyboardColumn.current].id : targetTask?.column

    if (targetColumn && targetColumn !== task.column) {
      moveTask(task, targetColumn)
      return
    }
    if (targetTask && targetTask.column === task.column) {
      if (!sortField && targetTask.id !== task.id) {
        const visible = visibleByColumn.get(task.column) ?? []
        const from = visible.findIndex((item) => item.id === task.id)
        const to = visible.findIndex((item) => item.id === targetTask.id)
        if (from >= 0 && to >= 0) {
          reorderTasks(task.column, arrayMove(visible.map((item) => item.id), from, to))
        }
      }
      return
    }

    if (!keyboardDrop && isColumnId(targetId) && targetId !== task.column) moveTask(task, targetId)
  }

  function open(next: DialogState) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setDialog(next)
  }

  function restoreFocus(event: Event) {
    event.preventDefault()
    opener.current?.focus()
  }

  function closeDialog() {
    setDialog(null)
  }

  function focusAddButton(column: ColumnId) {
    setTimeout(() => document.getElementById(`add-${column}`)?.focus(), 0)
  }

  function updateFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 grid gap-4">
        <h1 className="retro-title w-fit text-2xl font-black sm:text-3xl">Task Board</h1>
        <div className="retro-stripes" aria-hidden="true" />
      </header>

      <p role="status" aria-live="polite" className="sr-only">{status}</p>
      {storageError && (
        <p role="alert" className="mb-4 rounded-md border-2 border-destructive p-3 text-sm">
          {storageError}
        </p>
      )}

      <section aria-label="Task views and filters" className="mb-5 grid gap-4 rounded-md border-2 border-[var(--ink)] bg-card p-3">
        <nav aria-label="Task views" className="flex flex-wrap gap-2">
          {([
            ['board', 'Board'],
            ['due-today', 'Due today'],
            ['upcoming', 'Upcoming'],
          ] as const).map(([id, label]) => (
            <Button key={id} type="button" variant={view === id ? 'default' : 'outline'} aria-pressed={view === id} onClick={() => setView(id)}>
              {label}
            </Button>
          ))}
        </nav>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="task-search">Search title and description</Label>
            <Input id="task-search" type="search" value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-column">Column</Label>
            <select id="filter-column" value={filters.column} onChange={(event) => updateFilter('column', event.target.value as ColumnId | '')} className="h-11 rounded-md border-2 border-input bg-background px-3">
              <option value="">All columns</option>
              {COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-deadline">Deadline state</Label>
            <select id="filter-deadline" value={filters.deadlineState} onChange={(event) => updateFilter('deadlineState', event.target.value as DeadlineState | '')} className="h-11 rounded-md border-2 border-input bg-background px-3">
              <option value="">Any deadline</option>
              <option value="overdue">Overdue</option>
              <option value="due-today">Due today</option>
              <option value="upcoming">Upcoming</option>
              <option value="no-deadline">No deadline</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-priority">Priority</Label>
            <select id="filter-priority" value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value as Priority | '')} className="h-11 rounded-md border-2 border-input bg-background px-3">
              <option value="">Any priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-label">Label</Label>
            <select id="filter-label" value={filters.label} onChange={(event) => updateFilter('label', event.target.value)} className="h-11 rounded-md border-2 border-input bg-background px-3">
              <option value="">Any label</option>
              {labels.map((label) => <option key={label} value={label}>{label}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-status">Task status</Label>
            <select id="filter-status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value as TaskFilters['status'])} className="h-11 rounded-md border-2 border-input bg-background px-3">
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-44 gap-1.5">
            <Label htmlFor="sort-field">Sort by</Label>
            <select id="sort-field" value={sortField} onChange={(event) => setSortField(event.target.value as SortField | '')} className="h-11 rounded-md border-2 border-input bg-background px-3">
              <option value="">Custom order</option>
              <option value="deadline">Deadline</option>
              <option value="createdAt">Creation date</option>
              <option value="title">Title</option>
            </select>
          </div>
          {sortField && (
            <div className="grid min-w-36 gap-1.5">
              <Label htmlFor="sort-direction">Direction</Label>
              <select id="sort-direction" value={sortDirection} onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')} className="h-11 rounded-md border-2 border-input bg-background px-3">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          )}
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setFilters(defaultFilters)}>
            Clear filters
          </Button>
        </div>
      </section>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements, screenReaderInstructions }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnTasks = visibleByColumn.get(column.id) ?? []
            return (
              <Column
                key={column.id}
                id={column.id}
                label={column.label}
                tasks={columnTasks}
                reorderEnabled={!sortField}
                emptyMessage={tasks.length > 0 ? 'No matching tasks.' : 'No items yet. Add one or drag one here.'}
                onAdd={(id) => open({ mode: 'add', column: id })}
                onEdit={(task) => open({ mode: 'edit', task })}
                onDelete={setDeleting}
                onMove={moveTask}
                onComplete={setCompleted}
                onArchive={setArchived}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="retro-card flex rotate-2 rounded-md bg-card p-3">
              <TaskCardBody task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        state={dialog}
        onCloseAutoFocus={restoreFocus}
        onClose={closeDialog}
        onSubmit={(input, state) => {
          if (state.mode === 'add') addTask(input, state.column)
          else editTask(state.task.id, input)
          closeDialog()
        }}
      />

      <DeleteDialog
        task={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={(task) => {
          removeTask(task)
          setDeleting(null)
          focusAddButton(task.column)
        }}
      />
    </main>
  )
}
