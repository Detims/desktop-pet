const crypto = require('node:crypto')
const { ipcMain } = require('electron/main')

const registerTasksIpc = ({
  getTasksWindow,
  getPetSave,
  addTask,
  updateTask,
  deleteTask,
  broadcastTasks
}) => {
  ipcMain.handle('pet:get-tasks', () => {
    return getPetSave().tasks
  })

  ipcMain.handle('pet:add-task', (_event, taskInput) => {
    const title = String(taskInput?.title ?? '').trim()
    const notes = String(taskInput?.notes ?? '').trim()

    if (!title) {
      return {
        success: false,
        reason: 'Task title is required.',
        tasks: getPetSave().tasks
      }
    }

    const task = {
      id: crypto.randomUUID(),
      title,
      notes,
      completed: false,
      createdAt: Date.now()
    }

    const tasks = addTask(task)
    broadcastTasks()

    return {
      success: true,
      task,
      tasks
    }
  })

  ipcMain.handle('pet:update-task', (_event, updatedTask) => {
    if (!updatedTask?.id) {
      return {
        success: false,
        reason: 'Task id is required.',
        tasks: getPetSave().tasks
      }
    }

    const tasks = updateTask(updatedTask)
    broadcastTasks()

    return {
      success: true,
      tasks
    }
  })

  ipcMain.handle('pet:delete-task', (_event, taskId) => {
    const tasks = deleteTask(taskId)
    broadcastTasks()

    return {
      success: true,
      tasks
    }
  })

  ipcMain.on('tasks:close', () => {
    const tasksWindow = getTasksWindow()

    if (!tasksWindow || tasksWindow.isDestroyed()) return

    tasksWindow.close()
  })
}

module.exports = {
  registerTasksIpc
}