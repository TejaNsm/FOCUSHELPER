import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Task } from '@/lib/board'

interface DeleteDialogProps {
  task: Task | null
  onCancel: () => void
  onConfirm: (task: Task) => void
}

export function DeleteDialog({ task, onCancel, onConfirm }: DeleteDialogProps) {
  return (
    <AlertDialog open={task !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this task?</AlertDialogTitle>
          <AlertDialogDescription>
            "{task?.title}" will be permanently removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={() => task && onConfirm(task)}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
