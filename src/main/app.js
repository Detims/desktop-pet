const path = require('node:path')
const {
  loadPetSave,
  getPetSave,
  addXP,
  updateCurrency,
  addTask,
  updateTask,
  deleteTask,
  setGoogleSync,
  clearGoogleSync
} = require('./state/petSaveStore')
const { createWindowRegistry } = require('./windows/windowRegistry')
const { createWindowBroadcaster } = require('./state/windowBroadcaster')
const { createMainWindow } = require('./windows/createMainWindow')
const { createStatsWindow } = require('./windows/createStatsWindow')
const { createUtilityWindow } = require('./windows/createUtilityWindow')
const { createPetContextMenu } = require('./pet/contextMenu')
const { createCrawlingController } = require('./pet/crawlingController')
const { createWorkController } = require('./pet/workController')
const { registerIpcHandlers } = require('./ipc/registerIpcHandlers')

const createDesktopPetApp = () => {
  const windowRegistry = createWindowRegistry()
  const broadcaster = createWindowBroadcaster({ windowRegistry })

  let petMenu = null
  let isContextMenuOpen = false
  let isStarted = false
  let ipcRegistered = false
  let crawlingController = null
  let workController = null

  const getPreloadPath = () => {
    return path.join(__dirname, '../../preload.js')
  }

  const broadcastPetSave = () => {
    broadcaster.sendToAllWindows('pet:save-updated', getPetSave())
  }

  const broadcastTasks = () => {
    broadcaster.sendToWindows(['main', 'tasks'], 'pet:tasks-updated', getPetSave().tasks)
  }

  const broadcastGoogleSync = () => {
    broadcaster.sendToWindows(['main', 'tasks'], 'google:sync-updated', getPetSave().google)
  }

  const createShopWindow = () => {
    return createUtilityWindow({
      existingWindow: windowRegistry.getWindow('shop'),
      setWindow: (win) => windowRegistry.setWindow('shop', win),
      windowName: 'shop',
      hash: 'shop',
      preloadPath: getPreloadPath(),
      options: {
        skipTaskbar: true
      }
    })
  }

  const createWorkWindow = () => {
    return createUtilityWindow({
      existingWindow: windowRegistry.getWindow('work'),
      setWindow: (win) => windowRegistry.setWindow('work', win),
      windowName: 'work',
      hash: 'work',
      preloadPath: getPreloadPath()
    })
  }

  const createTasksWindow = () => {
    return createUtilityWindow({
      existingWindow: windowRegistry.getWindow('tasks'),
      setWindow: (win) => windowRegistry.setWindow('tasks', win),
      windowName: 'tasks',
      hash: 'tasks',
      preloadPath: getPreloadPath()
    })
  }

  const closeWindow = (name) => {
    const win = windowRegistry.getWindow(name)

    if (win && !win.isDestroyed()) {
      win.close()
    }
  }

  const closeSecondaryWindows = () => {
    closeWindow('stats')
    closeWindow('shop')
    closeWindow('work')
    closeWindow('tasks')
  }

  const createWindow = () => {
    const existingMainWindow = windowRegistry.getWindow('main')

    if (existingMainWindow && !existingMainWindow.isDestroyed()) {
      existingMainWindow.focus()
      return existingMainWindow
    }

    const mainWindow = createMainWindow({
      preloadPath: getPreloadPath()
    })

    windowRegistry.setWindow('main', mainWindow)

    mainWindow.on('closed', () => {
      closeSecondaryWindows()

      if (workController) {
        workController.destroy()
      }

      if (crawlingController) {
        crawlingController.destroy()
      }

      windowRegistry.setWindow('main', null)
      petMenu = null
    })

    petMenu = createPetContextMenu({
      getMainWindow: () => windowRegistry.getWindow('main'),
      getStatsWindow: () => windowRegistry.getWindow('stats'),
      openShopWindow: createShopWindow,
      openWorkWindow: createWorkWindow,
      openTasksWindow: createTasksWindow
    })

    const statsWindow = createStatsWindow({
      mainWindow,
      preloadPath: getPreloadPath()
    })

    windowRegistry.setWindow('stats', statsWindow)

    statsWindow.on('closed', () => {
      windowRegistry.setWindow('stats', null)
    })

    return mainWindow
  }

  const ensureControllers = () => {
    if (!crawlingController) {
      crawlingController = createCrawlingController({
        getMainWindow: () => windowRegistry.getWindow('main'),
        getActiveWork: () => workController?.getActiveWork() ?? null
      })
    }

    if (!workController) {
      workController = createWorkController({
        getMainWindow: () => windowRegistry.getWindow('main'),
        getWorkWindow: () => windowRegistry.getWindow('work'),
        addXP,
        updateCurrency,
        broadcastPetSave,
        stopPetCrawling: crawlingController.stopPetCrawling,
        scheduleCrawlAfterIdle: crawlingController.scheduleCrawlAfterIdle
      })
    }
  }

  const registerIpc = () => {
    if (ipcRegistered) return

    registerIpcHandlers({
      getMainWindow: () => windowRegistry.getWindow('main'),
      getStatsWindow: () => windowRegistry.getWindow('stats'),
      getShopWindow: () => windowRegistry.getWindow('shop'),
      getWorkWindow: () => windowRegistry.getWindow('work'),
      getTasksWindow: () => windowRegistry.getWindow('tasks'),
      getPetMenu: () => petMenu,

      getPetSave,
      addXP,
      updateCurrency,
      addTask,
      updateTask,
      deleteTask,
      setGoogleSync,
      clearGoogleSync,

      broadcastPetSave,
      broadcastTasks,
      broadcastGoogleSync,

      isContextMenuOpen: () => isContextMenuOpen,
      setContextMenuOpen: (value) => {
        isContextMenuOpen = value
      },

      startPetCrawling: crawlingController.startPetCrawling,
      stopPetCrawling: crawlingController.stopPetCrawling,
      setCrawlPosition: crawlingController.setCrawlPosition,

      workController
    })

    ipcRegistered = true
  }

  const start = () => {
    if (!isStarted) {
      loadPetSave()
      ensureControllers()
      registerIpc()
      isStarted = true
    } else {
      ensureControllers()
    }

    return createWindow()
  }

  const destroy = () => {
    closeSecondaryWindows()

    if (workController) {
      workController.destroy()
    }

    if (crawlingController) {
      crawlingController.destroy()
    }
  }

  return {
    start,
    destroy
  }
}

module.exports = {
  createDesktopPetApp
}
