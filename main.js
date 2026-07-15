const path = require('node:path');
const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron/main');
const { createMainWindow } = require('./src/main/windows/createMainWindow')
const { ensureWindowBoundsAreVisible } = require('./src/main/windows/windowBounds')
const { createUtilityWindow } = require('./src/main/windows/createUtilityWindow')
const { createStatsWindow } = require('./src/main/windows/createStatsWindow')
const {
  loadPetSave,
  getPetSave,
  updateCurrency,
  addTask,
  updateTask,
  deleteTask,
  setGoogleSync,
  clearGoogleSync,
  getWindowBounds,
  setWindowBounds
} = require('./src/main/state/petSaveStore')
const { registerIpcHandlers } = require('./src/main/ipc/registerIpcHandlers')
const { createCrawlingController } = require('./src/main/pet/crawlingController')

let crawlingController = null

const getPreloadPath = () => {
  return path.join(__dirname, 'preload.js')
}

const broadcastPetSave = () => {
  const windows = [mainWindow, shopWindow, workWindow, statsWindow, tasksWindow]

  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('pet:save-updated', getPetSave())
    }
  }
}

const broadcastGoogleSync = () => {
  const windows = [mainWindow, tasksWindow]

  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('google:sync-updated', getPetSave().google)
    }
  }
}

let mainWindow = null
let statsWindow = null
let shopWindow = null
let workWindow = null
let tasksWindow = null

let isContextMenuOpen = false
let crawlVelocity = { x: 1, y: 0 }
let activeWork = null
let workTimer = null

const IDLE_BEFORE_CRAWL_MS = 5_000

const PET_STATES = [
  'idle',
  'happy',
  'sad',
  'angry',
  'sleepy',
  'alert'
];

const broadcastTasks = () => {
  const windows = [mainWindow, tasksWindow]

  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('pet:tasks-updated', getPetSave().tasks)
    }
  }
}

const createTasksWindow = () => {
  return createUtilityWindow({
    existingWindow: tasksWindow,
    setWindow: (win) => {
      tasksWindow = win
    },
    windowName: 'tasks',
    hash: 'tasks',
    preloadPath: getPreloadPath()
  })
}

const createWorkWindow = () => {
  return createUtilityWindow({
    existingWindow: workWindow,
    setWindow: (win) => {
      workWindow = win
    },
    windowName: 'work',
    hash: 'work',
    preloadPath: getPreloadPath()
  })
}

const createShopWindow = () => {
  return createUtilityWindow({
    existingWindow: shopWindow,
    setWindow: (win) => {
      shopWindow = win
    },
    windowName: 'shop',
    hash: 'shop',
    preloadPath: getPreloadPath(),
    options: {
      skipTaskbar: true
    }
  })
}

const createPetContextMenu = (win) => {
    return Menu.buildFromTemplate([
      {
        label: 'Emotions',
        submenu: PET_STATES.map((state) => ({
          label: state.charAt(0).toUpperCase() + state.slice(1),
          click: () => { win.webContents.send('pet:set-state', state) }
        }))
      },
      {
        label: 'Talk',
        click: () => {
          win.webContents.send('pet:talk')
        }
      },
      {
        label: 'Shop',
        click: () => {
          if (statsWindow && !statsWindow.isDestroyed()) {
            statsWindow.hide()
          }

          createShopWindow()
        }
      },
      {
        label: 'Work',
        click: () => {
          if (statsWindow && !statsWindow.isDestroyed()) {
            statsWindow.hide()
          }
          
          createWorkWindow()
        }
      },
      {
        label: 'Tasks',
        click: () => {
          if (statsWindow && !statsWindow.isDestroyed()) {
            statsWindow.hide()
          }

          createTasksWindow()
        }
      },
      {
        label: 'Exit',
        click: () => { win.close() }
      },
    ]);
}

const createWindow = () => {
  mainWindow = createMainWindow({
    preloadPath: getPreloadPath()
  })

  mainWindow.on('closed', () => {
    if (statsWindow && !statsWindow.isDestroyed()) statsWindow.close()
    if (shopWindow && !shopWindow.isDestroyed()) shopWindow.close()
    if (workWindow && !workWindow.isDestroyed()) workWindow.close()
    if (tasksWindow && !tasksWindow.isDestroyed()) tasksWindow.close()
     
    if (crawlingController) {
      crawlingController.destroy()
    }

    if (workTimer) {
      clearInterval(workTimer)
      workTimer = null
    }

    activeWork = null
    mainWindow = null
  })

  petMenu = createPetContextMenu(mainWindow)

  statsWindow = createStatsWindow({
    mainWindow,
    preloadPath: getPreloadPath()
  })

  return mainWindow;
}

app.whenReady().then(() => {
  loadPetSave();

  crawlingController = createCrawlingController({
    getMainWindow: () => mainWindow,
    getActiveWork: () => activeWork
  })

  registerIpcHandlers({
    getMainWindow: () => mainWindow,
    getStatsWindow: () => statsWindow,
    getShopWindow: () => shopWindow,
    getWorkWindow: () => workWindow,
    getTasksWindow: () => tasksWindow,

    getPetMenu: () => petMenu,

    getPetSave,
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
    scheduleCrawlAfterIdle: crawlingController.scheduleCrawlAfterIdle,
    setCrawlPosition: crawlingController.setCrawlPosition,

    getActiveWork: () => activeWork,
    setActiveWork: (value) => {
      activeWork = value
    },
    getWorkTimer: () => workTimer,
    setWorkTimer: (value) => {
      workTimer = value
    }
  })

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})