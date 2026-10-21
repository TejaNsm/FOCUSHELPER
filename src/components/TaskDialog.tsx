import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  columnLabel,
  validateTitle,
  type ColumnId,
  type Task,
  type TaskInput,
} from '@/lib/board'

export type DialogState = { mode: 'add'; column: ColumnId } | { mode: 'edit'; task: Task }

interface TaskDialogProps {
  state: DialogState | null
  onClose: () => void
  onSubmit: (input: TaskInput, state: DialogState) => void
  onCloseAutoFocus?: (event: Event) => void
}

export function TaskDialog({ state, onClose, onSubmit, onCloseAutoFocus }: TaskDialogProps) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>{state && <TaskForm state={state} onClose={onClose} onSubmit={onSubmit} />}</DialogContent>
    </Dialog>
  )
}

function TaskForm({
  state,
  onClose,
  onSubmit,
}: {
  state: DialogState
  onClose: () => void
  onSubmit: (input: TaskInput, state: DialogState) => void
}) {
  const initial = state.mode === 'edit' ? state.task : null
  const [title, setTitle] = useState(initial?.title ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const problem = validateTitle(title)
    if (problem) {
      setError(problem)
      titleRef.current?.focus()
      return
    }
    onSubmit({ title, deadline: deadline || null, description }, state)
  }

  const heading = state.mode === 'add' ? `Add to ${columnLabel(state.column)}` : 'Edit task'

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{heading}</DialogTitle>
        <DialogDescription>Title is required. Deadline and description are optional.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="task-title">Title (required)</Label>
        <Input
          id="task-title"
          ref={titleRef}
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'task-title-error' : undefined}
          className="h-11"
        />
        {error && (
          <p id="task-title-error" role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-deadline">Deadline</Label>
        <Input
          id="task-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          aria-describedby="task-description-hint"
        />
        <p id="task-description-hint" className="text-sm text-muted-foreground">
          {description.length} / {DESCRIPTION_MAX} characters
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="min-h-11">
          {state.mode === 'add' ? 'Add task' : 'Save changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}
