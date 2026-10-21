import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/TaskCard'
import type { ColumnId, Task } from '@/lib/board'
import { cn } from '@/lib/utils'

interface ColumnProps {
  id: ColumnId
  label: string
  tasks: Task[]
  onAdd: (column: ColumnId) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, column: ColumnId) => void
  onComplete: (task: Task, completed: boolean) => void
  onArchive: (task: Task, archived: boolean) => void
  reorderEnabled: boolean
  emptyMessage?: string
}

export function Column({
  id,
  label,
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  onComplete,
  onArchive,
  reorderEnabled,
  emptyMessage,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const headingId = `column-${id}-heading`

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-column={id}
      className={cn(
        'retro-column flex min-h-48 min-w-0 flex-col gap-3 rounded-md bg-secondary p-3',
        isOver && 'outline-4 outline-dashed outline-offset-4 outline-[var(--ring)]',
      )}
    >
      <div
        className="-mx-3 -mt-3 flex items-center justify-between gap-2 border-b-[3px] border-[var(--ink)] p-3"
        style={{ background: `var(--col-${id})` }}
      >
        <h2 id={headingId} className="text-lg font-black">
          {label} <span>({tasks.length})</span>
        </h2>
        <Button id={`add-${id}`} className="min-h-11" onClick={() => onAdd(id)}>
          <Plus aria-hidden="true" />
          Add<span className="sr-only"> task to {label}</span>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-md border-2 border-dashed border-[var(--ink)] p-4 text-center text-sm text-muted-foreground">
          {emptyMessage ?? 'No items yet. Add one or drag one here.'}
        </p>
      ) : (
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onComplete={onComplete}
                onArchive={onArchive}
                reorderEnabled={reorderEnabled}
              />
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  )
}
