import { useEffect, useMemo, useState } from 'react'
import type { PetTask } from '../../types/pet'
import { GoogleTestPanel } from './GoogleTestPanel'

export function PetTasks() {
  const [tasks, setTasks] = useState<PetTask[]>([])
  const [isCompactView, setIsCompactView] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    window.desktopPet.getTasks().then(setTasks)

    return window.desktopPet.onTasksUpdated((nextTasks) => {
      setTasks(nextTasks)
    })
  }, [])

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed)
      }

      return b.createdAt - a.createdAt
    })
  }, [tasks])

  const submitTask = async () => {
    const result = await window.desktopPet.addTask({
      title,
      notes
    })

    if (!result.success) {
      setMessage(result.reason ?? 'Could not add task.')
      return
    }

    setTitle('')
    setNotes('')
    setIsAddingTask(false)
    setMessage(null)
  }

  const toggleTask = async (task: PetTask) => {
    await window.desktopPet.updateTask({
      ...task,
      completed: !task.completed
    })
  }

  const deleteTask = async (taskId: string) => {
    await window.desktopPet.deleteTask(taskId)
  }

  return (
    <main className="tasks-window">
      <div className="shop-titlebar">
        <div className="shop-titlebar-drag-region">
          <span className="shop-titlebar-icon">📝</span>
          <span className="shop-titlebar-title">Pet Tasks</span>
        </div>

        <div className="shop-titlebar-actions">
          <button
            type="button"
            aria-label="Close tasks"
            onClick={() => window.desktopPet.closeTasksWindow()}
          >
            ×
          </button>
        </div>
      </div>

      <section className="tasks-content">
        <header className="tasks-header">
          <div>
            <h1>Tasks</h1>
            <p>Track things your pet can help you remember.</p>
          </div>

          <label className="compact-toggle">
            <input
              type="checkbox"
              checked={isCompactView}
              onChange={(event) => setIsCompactView(event.target.checked)}
            />
            <span>Compact view</span>
          </label>
        </header>

        <GoogleTestPanel />

        {message && (
          <div className="tasks-message">
            {message}
          </div>
        )}

        {(isAddingTask || tasks.length === 0) && (
          <section className="task-form-card">
            <h2>Add Task</h2>

            <label>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task title"
              />
            </label>

            <label>
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes"
                rows={4}
              />
            </label>

            <div className="task-form-actions">
              {tasks.length > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setIsAddingTask(false)
                    setTitle('')
                    setNotes('')
                  }}
                >
                  Cancel
                </button>
              )}

              <button type="button" onClick={submitTask}>
                Add Task
              </button>
            </div>
          </section>
        )}

        {tasks.length > 0 && !isAddingTask && (
          <button
            type="button"
            className="add-task-button"
            onClick={() => setIsAddingTask(true)}
          >
            + Add Task
          </button>
        )}

        {tasks.length === 0 ? (
          <div className="tasks-empty-state">
            No tasks yet. Add your first task above.
          </div>
        ) : (
          <section className={isCompactView ? 'tasks-grid compact' : 'tasks-grid'}>
            {sortedTasks.map((task) => (
              <article
                key={task.id}
                className={task.completed ? 'task-card completed' : 'task-card'}
              >
                <div className="task-card-main">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                  />

                  <div>
                    <h2>{task.title}</h2>

                    {task.notes && (
                      <p>{task.notes}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="task-delete-button"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  )
}