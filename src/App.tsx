import { Board } from '@/components/Board'
import { FinanceWorkspace } from '@/components/FinanceWorkspace'
import { Button } from '@/components/ui/button'
import { useRef, useState, type KeyboardEvent } from 'react'

export default function App() {
  const [workspace, setWorkspace] = useState<'tasks' | 'finance'>('tasks')
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : direction
    if (!direction && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const index = workspace === 'tasks' ? 0 : 1
    const target = direction ? (index + direction + 2) % 2 : next
    setWorkspace(target === 0 ? 'tasks' : 'finance')
    tabs.current[target]?.focus()
  }
  return (
    <>
      <nav role="tablist" aria-label="FocusHelper workspaces" className="mx-auto flex max-w-6xl gap-2 px-4 pt-4 sm:px-6">
        <Button ref={(node) => { tabs.current[0] = node }} role="tab" id="workspace-tab-tasks" aria-selected={workspace === 'tasks'} aria-controls="workspace-panel-tasks" tabIndex={workspace === 'tasks' ? 0 : -1} variant={workspace === 'tasks' ? 'default' : 'outline'} className="min-h-11" onClick={() => setWorkspace('tasks')} onKeyDown={handleTabKey}>Task Board</Button>
        <Button ref={(node) => { tabs.current[1] = node }} role="tab" id="workspace-tab-finance" aria-selected={workspace === 'finance'} aria-controls="workspace-panel-finance" tabIndex={workspace === 'finance' ? 0 : -1} variant={workspace === 'finance' ? 'default' : 'outline'} className="min-h-11" onClick={() => setWorkspace('finance')} onKeyDown={handleTabKey}>Personal Finance</Button>
      </nav>
      <div role="tabpanel" id={`workspace-panel-${workspace}`} aria-labelledby={`workspace-tab-${workspace}`}>
        {workspace === 'tasks' ? <Board /> : <FinanceWorkspace />}
      </div>
    </>
  )
}
