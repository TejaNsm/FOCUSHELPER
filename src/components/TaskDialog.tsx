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
  normalizeLabels,
  validateTitle,
  type Priority,
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
  const [priority, setPriority] = useState<Priority | ''>(initial?.priority ?? '')
  const [labels, setLabels] = useState<string[]>(initial?.labels ?? [])
  const [labelInput, setLabelInput] = useState('')
  const [labelError, setLabelError] = useState<string | null>(null)
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
    let submittedLabels = labels
    if (labelInput.trim()) {
      const nextLabels = normalizeLabels([...labels, labelInput])
      if (nextLabels.length === labels.length) {
        setLabelError('Labels must be unique and cannot be blank.')
        return
      }
      submittedLabels = nextLabels
    }
    onSubmit(
      { title, deadline: deadline || null, description, priority: priority || null, labels: submittedLabels },
      state,
    )
  }

  function addLabel() {
    const next = normalizeLabels([...labels, labelInput])
    if (next.length === labels.length) {
      setLabelError('Enter a non-empty label that is not already on this task.')
      return
    }
    setLabels(next)
    setLabelInput('')
    setLabelError(null)
  }

  const heading = state.mode === 'add' ? `Add to ${columnLabel(state.column)}` : 'Edit task'

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{heading}</DialogTitle>
        <DialogDescription>Title is required. Deadline, description, priority, and labels are optional.</DialogDescription>
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

      <div className="grid gap-2">
        <Label htmlFor="task-priority">Priority</Label>
        <select
          id="task-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority | '')}
          className="h-11 rounded-md border-2 border-input bg-background px-3"
        >
          <option value="">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-label">Labels</Label>
        <div className="flex gap-2">
          <Input
            id="task-label"
            value={labelInput}
            onChange={(event) => {
              setLabelInput(event.target.value)
              if (labelError) setLabelError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addLabel()
              }
            }}
            aria-invalid={labelError ? true : undefined}
            aria-describedby={labelError ? 'task-label-error' : 'task-label-hint'}
            className="h-11"
          />
          <Button type="button" variant="outline" className="min-h-11" onClick={addLabel}>
            Add label
          </Button>
        </div>
        <p id={labelError ? 'task-label-error' : 'task-label-hint'} className="text-sm text-muted-foreground" role={labelError ? 'alert' : undefined}>
          {labelError ?? 'Labels are optional. Duplicate labels are ignored regardless of capitalization or spaces.'}
        </p>
        {labels.length > 0 && (
          <ul aria-label="Task labels" className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <li key={label}>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  aria-label={`Remove label ${label}`}
                  onClick={() => setLabels((current) => current.filter((item) => item !== label))}
                >
                  {label} <span aria-hidden="true">×</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
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
