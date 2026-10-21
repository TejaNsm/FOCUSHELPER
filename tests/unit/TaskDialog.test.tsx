import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskDialog } from '@/components/TaskDialog'

describe('TaskDialog (add)', () => {
  const state = { mode: 'add', column: 'tasks' } as const

  it('rejects blank and whitespace-only titles', async () => {
    const onSubmit = vi.fn()
    render(<TaskDialog state={state} onClose={() => {}} onSubmit={onSubmit} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required')

    await user.type(screen.getByLabelText(/title/i), '   ')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/title/i)).toHaveFocus()
  })

  it('submits the entered values', async () => {
    const onSubmit = vi.fn()
    render(<TaskDialog state={state} onClose={() => {}} onSubmit={onSubmit} />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/title/i), 'Pay rent')
    await user.type(screen.getByLabelText('Deadline'), '2026-11-01')
    await user.type(screen.getByLabelText('Description'), 'monthly')
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(onSubmit).toHaveBeenCalledWith(
      { title: 'Pay rent', deadline: '2026-11-01', description: 'monthly', priority: null, labels: [] },
      state,
    )
  })

  it('submits priority and trimmed labels', async () => {
    const onSubmit = vi.fn()
    render(<TaskDialog state={state} onClose={() => {}} onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/title/i), 'Plan')
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    await user.type(screen.getByLabelText('Labels'), ' Work ')
    await user.click(screen.getByRole('button', { name: 'Add label' }))
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(onSubmit).toHaveBeenCalledWith(
      { title: 'Plan', deadline: null, description: '', priority: 'high', labels: ['Work'] },
      state,
    )
  })

  it('cancel closes without submitting', async () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn()
    render(<TaskDialog state={state} onClose={onClose} onSubmit={onSubmit} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
