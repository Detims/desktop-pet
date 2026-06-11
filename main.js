const path = require('node:path');
const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron/main');

let mainWindow = null
let statsWindow = null
let crawlTimer = null
let crawlDecisionTimer = null
let crawlIdleTimer = null
let crawlPosition = null
let isCrawling = false
let isContextMenuOpen = false
let crawlStoppedByUser = false
let crawlVelocity = { x: 1, y: 0 }

const IDLE_BEFORE_CRAWL_MS = 5_000

const PET_STATES = [
  'idle',
  'happy',
  'sad',
  'angry',
  'sleepy',
  'alert'
];

const chooseRandomCrawlDirection = () => {
  const speed = 1.2
  
  crawlVelocity = {
    x: Math.random() > 0.5 ? speed : -speed,
    y: 0
  }
}

const scheduleCrawlAfterIdle = () => {
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
        label: 'Exit',
        click: () => { win.close() }
      }
    ]);
}

const createStatsWindow = () => {
  statsWindow = new BrowserWindow({
    width: 240,
    height: 280,
    parent: mainWindow,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  statsWindow.setAlwaysOnTop(true, 'screen-saver')
  statsWindow.setIgnoreMouseEvents(true)
  statsWindow.hide()

  if (!app.isPackaged) {
    statsWindow.loadURL('http://127.0.0.1:5173/#/stats')
  } else {
    statsWindow.loadFile(path.join(__dirname, 'dist/index.html'), {
      hash: '/stats'
    })
  }

  return statsWindow
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 440,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Keep pet above normal windows and fullscreen apps
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }) // MacOS

  const petMenu = createPetContextMenu(mainWindow);
  createStatsWindow()

  ipcMain.on('pet:show-context-menu', () => {
    isContextMenuOpen = true

    if (statsWindow) 
      statsWindow.hide()

    petMenu.popup({
      window: mainWindow,
      callback: () => {
        isContextMenuOpen = false

        if (mainWindow && !mainWindow.isDestroyed()) 
          mainWindow.webContents.send('pet:context-menu-closed')
      }
    })
  });

  ipcMain.handle('pet:get-window-position', () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;

    if (!win) {
      return { x: 0, y: 0 }
    }

    const [x, y] = win.getPosition()
    return { x, y }
  });

  // Dragging the pet around
  ipcMain.on('pet:set-window-position', (_event, position) => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow

    if (!win) return

    const nextX = Math.round(position.x)
    const nextY = Math.round(position.y)

    win.setPosition(nextX, nextY)

    crawlPosition = {
      x: nextX,
      y: nextY
    }
  });

  // Start crawling after inactivity
  ipcMain.on('pet:start-crawling', () => {
    if (mainWindow) startPetCrawling(mainWindow)
  })

  ipcMain.on('pet:stop-crawling', () => {
    stopPetCrawling({
      byUser: true,
      scheduleRestart: false
    })
  })

  ipcMain.on('pet:show-stats-menu', (_event, position) => {
    if (isContextMenuOpen) return
    if (!statsWindow || statsWindow.isDestroyed()) return

    statsWindow.setPosition(
      Math.round(position.x),
      Math.round(position.y)
    )

    statsWindow.showInactive()
  })

  ipcMain.on('pet:move-stats-menu', (_event, position) => {
    if (isContextMenuOpen) return
    if (!statsWindow || statsWindow.isDestroyed()) return
    if (!statsWindow.isVisible()) return

    statsWindow.setPosition(
      Math.round(position.x),
      Math.round(position.y)
    )
  })

  ipcMain.on('pet:hide-stats-menu', () => {
    if (!statsWindow || statsWindow.isDestroyed()) return

    statsWindow.hide()
  })

  // Run npm run dev, open new terminal, npm run start
  if (!app.isPackaged) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  return mainWindow;
}

app.whenReady().then(() => {
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