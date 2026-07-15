const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron/main')
const { normalizePetSave, applyXPGain } = require('../pet/progression')

const DEFAULT_PET_SAVE = {
  currency: 100,
  level: 1,
  xp: 0,
  toNextLevel: 100,
  totalXpEarned: 0,
  tasks: [],
  google: {
    lastSyncedAt: null,
    emails: [],
    calendarEvents: [],
    tasks: []
  },
  windows: {
    shop: null,
    work: null,
    tasks: null
  }
}

let petSave = { ...DEFAULT_PET_SAVE }

const getSavePath = () => {
  return path.join(app.getPath('userData'), 'pet-save.json')
}

const normalizePetSave = (parsedSave) => {
  const save = {
    ...DEFAULT_PET_SAVE,
    ...parsedSave,
    tasks: Array.isArray(parsedSave.tasks) ? parsedSave.tasks : [],
    google: {
      ...DEFAULT_PET_SAVE.google,
      ...(parsedSave.google ?? {})
    },
    windows: {
      ...DEFAULT_PET_SAVE.windows,
      ...(parsedSave.windows ?? {})
    }
  }

  return normalizePetSave(save)
}

const loadPetSave = () => {
  try {
    const savePath = getSavePath()

    if (!fs.existsSync(savePath)) {
      petSave = { ...DEFAULT_PET_SAVE }
      savePetSave()
      return petSave
    }

    const rawSave = fs.readFileSync(savePath, 'utf8')
    const parsedSave = JSON.parse(rawSave)

    petSave = normalizePetSave(parsedSave)

    return petSave
  } catch (error) {
    console.error('Failed to load pet save:', error)
    petSave = { ...DEFAULT_PET_SAVE }
    return petSave
  }
}

const savePetSave = () => {
  try {
    fs.writeFileSync(
      getSavePath(),
      JSON.stringify(petSave, null, 2),
      'utf8'
    )
  } catch (error) {
    console.error('Failed to save pet data:', error)
  }
}

const getPetSave = () => {
  return petSave
}

const setPetSave = (nextSave) => {
  petSave = normalizePetSave(nextSave)
  savePetSave()
  return petSave
}

const addXP = (amount) => {
  const result = applyXPGain(petSave, amount)

  petSave = result.save
  savePetSave()

  return result
}

const updateCurrency = (amount) => {
  petSave = {
    ...petSave,
    currency: Math.max(0, petSave.currency + amount)
  }

  savePetSave()
  return petSave
}

const setTasks = (tasks) => {
  petSave = {
    ...petSave,
    tasks: Array.isArray(tasks) ? tasks : []
  }

  savePetSave()
  return petSave.tasks
}

const addTask = (task) => {
  petSave = {
    ...petSave,
    tasks: [task, ...(petSave.tasks ?? [])]
  }

  savePetSave()
  return petSave.tasks
}

const updateTask = (updatedTask) => {
  petSave = {
    ...petSave,
    tasks: petSave.tasks.map((task) => {
      if (task.id !== updatedTask.id) return task

      return {
        ...task,
        ...updatedTask,
        title: String(updatedTask.title ?? task.title).trim(),
        notes: String(updatedTask.notes ?? task.notes ?? '').trim()
      }
    })
  }

  savePetSave()
  return petSave.tasks
}

const deleteTask = (taskId) => {
  petSave = {
    ...petSave,
    tasks: petSave.tasks.filter((task) => task.id !== taskId)
  }

  savePetSave()
  return petSave.tasks
}

const setGoogleSync = ({ emails, calendarEvents, tasks }) => {
  petSave = {
    ...petSave,
    google: {
      lastSyncedAt: Date.now(),
      emails,
      calendarEvents,
      tasks
    }
  }

  savePetSave()
  return petSave.google
}

const clearGoogleSync = () => {
  petSave = {
    ...petSave,
    google: {
      ...DEFAULT_PET_SAVE.google
    }
  }

  savePetSave()
  return petSave.google
}

const getWindowBounds = (windowName, fallbackBounds) => {
  return petSave.windows?.[windowName] ?? fallbackBounds
}

const setWindowBounds = (windowName, bounds) => {
  petSave = {
    ...petSave,
    windows: {
      ...(petSave.windows ?? {}),
      [windowName]: bounds
    }
  }

  savePetSave()
  return petSave.windows[windowName]
}

module.exports = {
  DEFAULT_PET_SAVE,
  loadPetSave,
  savePetSave,
  getPetSave,
  setPetSave,
  addXP,
  updateCurrency,
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setGoogleSync,
  clearGoogleSync,
  getWindowBounds,
  setWindowBounds
}