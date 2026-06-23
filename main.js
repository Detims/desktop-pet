const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto')
const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron/main');
const {
  authorizeGoogle,
  disconnectGoogle,
  getGoogleConnectionStatus,
  getRecentEmails,
  getUpcomingCalendarEvents,
  getGoogleTasks
} = require('./src/main/google/googleClient')

const DEFAULT_PET_SAVE = {
  currency: 100,
  level: 1,
  tasks: [],
  windows: {
    shop: null,
    work: null
  }
}

let petSave = { ...DEFAULT_PET_SAVE }

const getSavePath = () => {
  return path.join(app.getPath('userData'), 'pet-save.json')
}

const loadPetSave = () => {
  try {
    const savePath = getSavePath()

    if (!fs.existsSync(savePath)) {
      petSave = { ...DEFAULT_PET_SAVE }
      savePetSave()
      return
    }

    const rawSave = fs.readFileSync(savePath, 'utf8')
    const parsedSave = JSON.parse(rawSave)

    petSave = {
      ...DEFAULT_PET_SAVE,
      ...parsedSave,
      tasks: Array.isArray(parsedSave.tasks) ? parsedSave.tasks : [],
      windows: {
        ...DEFAULT_PET_SAVE.windows,
        ...(parsedSave.windows ?? {})
      }
    }
  } catch (error) {
    console.error('Failed to load pet save:', error)
    petSave = { ...DEFAULT_PET_SAVE }
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

const broadcastPetSave = () => {
  const windows = [mainWindow, shopWindow, workWindow, statsWindow, tasksWindow]

  for (const win of windows) {
    if (win && !win.isDestroyed()) {
      win.webContents.send('pet:save-updated', petSave)
    }
  }
}

const getSavedWindowBounds = (windowName, fallbackBounds) => {
  return petSave.windows?.[windowName] ?? fallbackBounds
}

const saveWindowBounds = (windowName, win) => {
  if (!win || win.isDestroyed()) return

  const bounds = win.getBounds()

  petSave = {
    ...petSave,
    windows: {
      ...(petSave.windows ?? {}),
      [windowName]: bounds
    }
  }

  savePetSave()
}

const ensureWindowBoundsAreVisible = (bounds) => {
  if (bounds.x === undefined || bounds.y === undefined) {
    return bounds
  }

  const matchingDisplay = screen.getAllDisplays().find((display) => {
    const area = display.workArea

    return (
      bounds.x >= area.x &&
      bounds.y >= area.y &&
      bounds.x < area.x + area.width &&
      bounds.y < area.y + area.height
    )
  })

  if (matchingDisplay) {
    return bounds
  }

  return {
    ...bounds,
    x: undefined,
    y: undefined
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
      win.webContents.send('pet:tasks-updated', petSave.tasks)
    }
  }
}

const createTasksWindow = () => {
  if (tasksWindow && !tasksWindow.isDestroyed()) {
    tasksWindow.focus()
    return tasksWindow
  }

  const bounds = ensureWindowBoundsAreVisible(
    getSavedWindowBounds('tasks', {
      width: 720,
      height: 520
    })
  )

  tasksWindow = new BrowserWindow({
    ...bounds,
    minWidth: 520,
    minHeight: 420,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  tasksWindow.setMenuBarVisibility(false)

  tasksWindow.on('close', () => {
    saveWindowBounds('tasks', tasksWindow)
  })

  tasksWindow.on('closed', () => {
    tasksWindow = null
  })

  if (!app.isPackaged) {
    tasksWindow.loadURL('http://127.0.0.1:5173/#/tasks')
  } else {
    tasksWindow.loadFile(path.join(__dirname, 'dist/index.html'), {
      hash: '/tasks'
    })
  }

  return tasksWindow
}

const updateCurrency = (amount) => {
  petSave = {
    ...petSave,
    currency: Math.max(0, petSave.currency + amount)
  }

  savePetSave()
  broadcastPetSave()

  return petSave.currency
}

const createWorkWindow = () => {
  if (workWindow && !workWindow.isDestroyed()) {
    workWindow.focus()
    return workWindow
  }

  const bounds = ensureWindowBoundsAreVisible(
    getSavedWindowBounds('work', {
      width: 720,
      height: 520
    })
  )


  workWindow = new BrowserWindow({
    ...bounds,
    minWidth: 520,
    minHeight: 420,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  workWindow.setMenuBarVisibility(false)

  workWindow.on('close', () => {
    saveWindowBounds('work', workWindow)
  })

  workWindow.on('closed', () => {
    workWindow = null
  })

  if (!app.isPackaged) {
    workWindow.loadURL('http://127.0.0.1:5173/#/work')
  } else {
    workWindow.loadFile(path.join(__dirname, 'dist/index.html'), {
      hash: '/work'
    })
  }

  return workWindow
}

const chooseRandomCrawlDirection = () => {
  const speed = 1.2
  
  crawlVelocity = {
    x: Math.random() > 0.5 ? speed : -speed,
    y: 0
  }
}

const createShopWindow = () => {
  if (shopWindow && !shopWindow.isDestroyed()) {
    shopWindow.focus()
    return shopWindow
  }

  const bounds = ensureWindowBoundsAreVisible(
    getSavedWindowBounds('shop', {
      width: 720,
      height: 520
    })
  )

  shopWindow = new BrowserWindow({
    ...bounds,
    minWidth: 520,
    minHeight: 420,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  shopWindow.setMenuBarVisibility(false)

  shopWindow.on('close', () => {
    saveWindowBounds('shop', shopWindow)
  })

  shopWindow.on('closed', () => {
    shopWindow = null
  })

  if (!app.isPackaged) {
    shopWindow.loadURL('http://127.0.0.1:5173/#/shop')
  } else {
    shopWindow.loadFile(path.join(__dirname, 'dist/index.html'), {
      hash: '/shop'
    })
  }

  return shopWindow
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

const createStatsWindow = () => {
  statsWindow = new BrowserWindow({
    width: 240,
    height: 360,
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

  mainWindow.on('closed', () => {
    if (statsWindow && !statsWindow.isDestroyed()) 
      statsWindow.close()

    if (shopWindow && !shopWindow.isDestroyed())
      shopWindow.close()

    if (workWindow && !workWindow.isDestroyed())
      workWindow.close()

    if (tasksWindow && !tasksWindow.isDestroyed()) {
      tasksWindow.close()
    }   

    if (workTimer) {
      clearInterval(workTimer)
      workTimer = null
    }

    activeWork = null
    mainWindow = null
  })

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

  ipcMain.on('shop:close', () => {
    if (!shopWindow || shopWindow.isDestroyed()) return

    shopWindow.close()
  })

  const sendWorkUpdate = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pet:work-updated', activeWork)
    }

    if (workWindow && !workWindow.isDestroyed()) {
      workWindow.webContents.send('pet:work-updated', activeWork)
    }
  }

  ipcMain.on('pet:start-work', (_event, workOption) => {
    if (activeWork) return

    if (workWindow && !workWindow.isDestroyed()) {
      workWindow.close()
    }

    stopPetCrawling({
      byUser: false,
      scheduleRestart: false
    })

    const startedAt = Date.now()
    const endsAt = startedAt + workOption.durationSeconds * 1000

    activeWork = {
      id: workOption.id,
      name: workOption.name,
      currencyReward: workOption.currencyReward,
      startedAt,
      endsAt,
      remainingSeconds: workOption.durationSeconds
    }

    sendWorkUpdate()

    workTimer = setInterval(() => {
      if (!activeWork) return

      const remainingMs = activeWork.endsAt - Date.now()
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

      activeWork = {
        ...activeWork,
        remainingSeconds
      }

      sendWorkUpdate()

      if (remainingSeconds <= 0) {
        clearInterval(workTimer)
        workTimer = null

        const completedWork = activeWork
        activeWork = null

        if (completedWork) {
          updateCurrency(completedWork.currencyReward)
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet:work-completed', completedWork)
        }

        if (workWindow && !workWindow.isDestroyed()) {
          workWindow.webContents.send('pet:work-completed', completedWork)
        }

        sendWorkUpdate()
        scheduleCrawlAfterIdle()
      }
    }, 1000)
  })

  ipcMain.on('pet:cancel-work', () => {
    if (workTimer) {
      clearInterval(workTimer)
      workTimer = null
    }

    activeWork = null
    sendWorkUpdate()
    scheduleCrawlAfterIdle()
  })

  ipcMain.handle('pet:get-active-work', () => {
    return activeWork
  })

  ipcMain.on('work:close', () => {
    if (!workWindow || workWindow.isDestroyed()) return
    workWindow.close()
  })

  ipcMain.handle('pet:get-save', () => {
    return petSave
  })

  ipcMain.handle('pet:purchase-item', (_event, item) => {
    if (!item || typeof item.price !== 'number') {
      return {
        success: false,
        reason: 'Invalid item.',
        save: petSave
      }
    }

    if (petSave.currency < item.price) {
      return {
        success: false,
        reason: 'Not enough currency.',
        save: petSave
      }
    }

    updateCurrency(-item.price)

    return {
      success: true,
      save: petSave
    }
  })

  ipcMain.handle('pet:get-tasks', () => {
    return petSave.tasks
  })

  ipcMain.handle('pet:add-task', (_event, taskInput) => {
    const title = String(taskInput?.title ?? '').trim()
    const notes = String(taskInput?.notes ?? '').trim()

    if (!title) {
      return {
        success: false,
        reason: 'Task title is required.',
        tasks: petSave.tasks
      }
    }

    const task = {
      id: crypto.randomUUID(),
      title,
      notes,
      completed: false,
      createdAt: Date.now()
    }

    petSave = {
      ...petSave,
      tasks: [task, ...(petSave.tasks ?? [])]
    }

    savePetSave()
    broadcastTasks()

    return {
      success: true,
      task,
      tasks: petSave.tasks
    }
  })

  ipcMain.handle('pet:update-task', (_event, updatedTask) => {
    if (!updatedTask?.id) {
      return {
        success: false,
        reason: 'Task id is required.',
        tasks: petSave.tasks
      }
    }

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
    broadcastTasks()

    return {
      success: true,
      tasks: petSave.tasks
    }
  })

  ipcMain.handle('pet:delete-task', (_event, taskId) => {
    petSave = {
      ...petSave,
      tasks: petSave.tasks.filter((task) => task.id !== taskId)
    }

    savePetSave()
    broadcastTasks()

    return {
      success: true,
      tasks: petSave.tasks
    }
  })

  ipcMain.on('tasks:close', () => {
    if (!tasksWindow || tasksWindow.isDestroyed()) return
    tasksWindow.close()
  })

  ipcMain.handle('google:get-status', () => {
    return getGoogleConnectionStatus()
  })

  ipcMain.handle('google:connect', async () => {
    try {
      await authorizeGoogle()

      return {
        success: true,
        connected: true
      }
    } catch (error) {
      console.error('Google connect failed:', error)

      return {
        success: false,
        connected: false,
        reason: error instanceof Error ? error.message : 'Google connection failed.'
      }
    }
  })

  ipcMain.handle('google:disconnect', () => {
    try {
      disconnectGoogle()

      return {
        success: true,
        connected: false
      }
    } catch (error) {
      console.error('Google disconnect failed:', error)

      return {
        success: false,
        connected: getGoogleConnectionStatus().connected,
        reason: error instanceof Error ? error.message : 'Google disconnect failed.'
      }
    }
  })

  ipcMain.handle('google:get-recent-emails', async () => {
    try {
      const emails = await getRecentEmails()

      return {
        success: true,
        emails
      }
    } catch (error) {
      console.error('Failed to fetch recent emails:', error)

      return {
        success: false,
        emails: [],
        reason: error instanceof Error ? error.message : 'Failed to fetch recent emails.'
      }
    }
  })

  ipcMain.handle('google:get-calendar-events', async () => {
    try {
      const events = await getUpcomingCalendarEvents()

      return {
        success: true,
        events
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error)

      return {
        success: false,
        events: [],
        reason: error instanceof Error ? error.message : 'Failed to fetch calendar events.'
      }
    }
  })

  ipcMain.handle('google:get-tasks', async () => {
    try {
      const tasks = await getGoogleTasks()

      return {
        success: true,
        tasks
      }
    } catch (error) {
      console.error('Failed to fetch Google tasks:', error)

      return {
        success: false,
        tasks: [],
        reason: error instanceof Error ? error.message : 'Failed to fetch Google tasks.'
      }
    }
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
  loadPetSave();

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