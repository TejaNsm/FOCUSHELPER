import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeleteDialog } from '@/components/DeleteDialog'
import { createTask } from '@/lib/board'

const task = createTask({ title: 'Pay rent', deadline: null, description: '' }, 'tasks')

describe('DeleteDialog', () => {
  it('confirm calls the handler with the task', async () => {
    const onConfirm = vi.fn()
    render(<DeleteDialog task={task} onCancel={() => {}} onConfirm={onConfirm} />)
    expect(screen.getByText(/Pay rent/)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove' }))
    expect(onConfirm).toHaveBeenCalledWith(task)
  })

  it('cancel does not call confirm', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<DeleteDialog task={task} onCancel={onCancel} onConfirm={onConfirm} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
