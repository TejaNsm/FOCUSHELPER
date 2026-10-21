import { useDraggable } from '@dnd-kit/core'
import { AlertCircle, Calendar, GripVertical, MoveRight, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { COLUMNS, formatDeadline, isOverdue, type ColumnId, type Task } from '@/lib/board'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onMove: (task: Task, column: ColumnId) => void
}

export function TaskCardBody({ task }: { task: Task }) {
  const overdue = isOverdue(task.deadline)
  return (
    <div className="min-w-0 flex-1">
      <h3 className="wrap-anywhere font-medium leading-snug">{task.title}</h3>
      {task.deadline && (
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-4" aria-hidden="true" />
            <span className="sr-only">Deadline: </span>
            <time dateTime={task.deadline}>{formatDeadline(task.deadline)}</time>
          </span>
          {overdue && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              Overdue
            </Badge>
          )}
        </p>
      )}
      {task.description && (
        <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm">{task.description}</p>
      )}
    </div>
  )
}

export function TaskCard({ task, onEdit, onDelete, onMove }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <li
      ref={setNodeRef}
      className={cn(
        'retro-card flex gap-1 rounded-md bg-card p-2 text-card-foreground',
        isDragging && 'opacity-40',
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 cursor-grab touch-none"
        aria-label={`Drag ${task.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </Button>

      <TaskCardBody task={task} />

      <div className="flex shrink-0 flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Move ${task.title} to another column`}
            >
              <MoveRight aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to…</DropdownMenuLabel>
            {COLUMNS.filter((c) => c.id !== task.column).map((c) => (
              <DropdownMenuItem key={c.id} className="min-h-11" onSelect={() => onMove(task, c.id)}>
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}
