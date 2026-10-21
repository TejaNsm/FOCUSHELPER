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
import { Column } from '@/components/Column'
import { DeleteDialog } from '@/components/DeleteDialog'
import { TaskCardBody } from '@/components/TaskCard'
import { TaskDialog, type DialogState } from '@/components/TaskDialog'
import { useBoard } from '@/hooks/useBoard'
import { COLUMNS, columnLabel, isColumnId, tasksInColumn, type ColumnId, type Task } from '@/lib/board'

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    'To pick up a task, press space or enter. Use the arrow keys to move it to another column. Press space or enter again to drop it, or escape to cancel.',
}

// Arrow keys jump straight to the neighbouring column instead of nudging by a few pixels.
// The target column is tracked here so rapid key presses never rely on stale layout data.
const keyboardColumn = { current: 0 }

const keyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  const forward = event.code === 'ArrowRight' || event.code === 'ArrowDown'
  const backward = event.code === 'ArrowLeft' || event.code === 'ArrowUp'
  if (!forward && !backward) return undefined
  event.preventDefault()

  const rectOf = (index: number) =>
    document.querySelector(`[data-column="${COLUMNS[index].id}"]`)?.getBoundingClientRect()
  const from = rectOf(keyboardColumn.current)
  const nextIndex = Math.min(COLUMNS.length - 1, Math.max(0, keyboardColumn.current + (forward ? 1 : -1)))
  const to = rectOf(nextIndex)
  if (!from || !to || nextIndex === keyboardColumn.current) return undefined

  keyboardColumn.current = nextIndex
  return {
    x: currentCoordinates.x + (to.left + to.width / 2 - (from.left + from.width / 2)),
    y: currentCoordinates.y + (to.top + to.height / 2 - (from.top + from.height / 2)),
  }
}

// Touch input is handled by TouchSensor (press-and-hold) so quick swipes on a handle never start a drag.
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
  const { tasks, status, addTask, editTask, removeTask, moveTask } = useBoard()
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseAndPenSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  )

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])
  const activeTask = activeId ? (byId.get(activeId) ?? null) : null

  const titleOf = (id: string | number) => byId.get(String(id))?.title ?? 'task'
  const overLabel = (id: string | number | undefined) =>
    id !== undefined && isColumnId(String(id)) ? columnLabel(String(id) as ColumnId) : null

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up "${titleOf(active.id)}".`,
    onDragOver: ({ active, over }) => {
      const label = overLabel(over?.id)
      return label ? `"${titleOf(active.id)}" is over ${label}.` : undefined
    },
    onDragEnd: ({ active, over }) => {
      const label = overLabel(over?.id)
      return label ? `Dropped "${titleOf(active.id)}" in ${label}.` : `Dropped "${titleOf(active.id)}".`
    },
    onDragCancel: ({ active }) => `Cancelled. "${titleOf(active.id)}" was not moved.`,
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    setActiveId(id)
    keyboardColumn.current = Math.max(0, COLUMNS.findIndex((c) => c.id === byId.get(id)?.column))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const task = byId.get(String(event.active.id))
    // Keyboard drops use the tracked column: dnd-kit recomputes `over` asynchronously.
    const isKeyboard = event.activatorEvent instanceof KeyboardEvent
    const target = isKeyboard ? COLUMNS[keyboardColumn.current].id : event.over ? String(event.over.id) : null
    if (task && target && isColumnId(target)) {
      moveTask(task, target)
    }
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

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 grid gap-4">
        <h1 className="retro-title w-fit text-2xl font-black sm:text-3xl">Task Board</h1>
        <div className="retro-stripes" aria-hidden="true" />
      </header>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements, screenReaderInstructions }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {COLUMNS.map((c) => (
            <Column
              key={c.id}
              id={c.id}
              label={c.label}
              tasks={tasksInColumn(tasks, c.id)}
              onAdd={(column) => open({ mode: 'add', column })}
              onEdit={(task) => open({ mode: 'edit', task })}
              onDelete={setDeleting}
              onMove={moveTask}
            />
          ))}
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
