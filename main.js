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

let crawlTimer = null
let crawlDecisionTimer = null
let crawlIdleTimer = null
let crawlPosition = null
let isCrawling = false
let isContextMenuOpen = false
let crawlStoppedByUser = false
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

const chooseRandomCrawlDirection = () => {
  const speed = 1.2
  
  crawlVelocity = {
    x: Math.random() > 0.5 ? speed : -speed,
    y: 0
  }
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

const scheduleCrawlAfterIdle = () => {
  if (activeWork) return

  if (crawlIdleTimer) {
    clearTimeout(crawlIdleTimer)
    crawlIdleTimer = null
  }

  crawlIdleTimer = setTimeout(() => {
    crawlIdleTimer = null

    if (!crawlStoppedByUser && mainWindow && !mainWindow.isDestroyed()) {
      startPetCrawling(mainWindow)
    }
  }, IDLE_BEFORE_CRAWL_MS)
}

const startPetCrawling = (win) => {
  if (activeWork) return
  if (!win || win.isDestroyed()) return
  if (isCrawling) return

  if (crawlIdleTimer) {
    clearTimeout(crawlIdleTimer)
    crawlIdleTimer = null
  }

  if (crawlTimer) {
    clearInterval(crawlTimer)
    crawlTimer = null
  }

  if (crawlDecisionTimer) {
    clearInterval(crawlDecisionTimer)
    crawlDecisionTimer = null
  }

  crawlStoppedByUser = false
  isCrawling = true

  const [startX, startY] = win.getPosition()
  crawlPosition = { x: startX, y: startY }

  chooseRandomCrawlDirection()

  crawlTimer = setInterval(() => {
    if (!win || win.isDestroyed() || !crawlPosition) return

    const [width, height] = win.getSize()

    const display = screen.getDisplayNearestPoint({
      x: crawlPosition.x,
      y: crawlPosition.y
    })

    const bounds = display.workArea

    crawlPosition.x += crawlVelocity.x
    crawlPosition.y += crawlVelocity.y

    if (crawlPosition.x <= bounds.x) {
      crawlPosition.x = bounds.x
      crawlVelocity.x = Math.abs(crawlVelocity.x)
    }

    if (crawlPosition.x + width >= bounds.x + bounds.width) {
      crawlPosition.x = bounds.x + bounds.width - width
      crawlVelocity.x = -Math.abs(crawlVelocity.x)
    }

    if (crawlPosition.y <= bounds.y) {
      crawlPosition.y = bounds.y
      crawlVelocity.y = Math.abs(crawlVelocity.y)
    }

    if (crawlPosition.y + height >= bounds.y + bounds.height) {
      crawlPosition.y = bounds.y + bounds.height - height
      crawlVelocity.y = -Math.abs(crawlVelocity.y)
    }

    win.setPosition(
      Math.round(crawlPosition.x),
      Math.round(crawlPosition.y)
    )
  }, 16)

  crawlDecisionTimer = setInterval(() => {
    if (!isCrawling) return

    const roll = Math.random()

    if (roll < 0.1) {
      stopPetCrawling({ 
        byUser: false,
        scheduleRestart: true
      })
      return
    }

    if (roll < 0.2) {
      chooseRandomCrawlDirection()
    }
  }, 1000)
}

const stopPetCrawling = ({ byUser = false, scheduleRestart = true } = {}) => {
  isCrawling = false
  crawlStoppedByUser = byUser

  if (crawlTimer) {
    clearInterval(crawlTimer)
    crawlTimer = null
  }

  if (crawlDecisionTimer) {
    clearInterval(crawlDecisionTimer)
    crawlDecisionTimer = null
  }

  if (crawlIdleTimer) {
    clearTimeout(crawlIdleTimer)
    crawlIdleTimer = null
  }

  if (scheduleRestart && !byUser) {
    scheduleCrawlAfterIdle()
  }
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

    startPetCrawling,
    stopPetCrawling,
    scheduleCrawlAfterIdle,
    setCrawlPosition: (position) => {
      crawlPosition = position
    },

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