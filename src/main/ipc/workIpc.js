const { ipcMain } = require('electron/main')

const registerWorkIpc = ({
  getMainWindow,
  getWorkWindow,
  getActiveWork,
  setActiveWork,
  getWorkTimer,
  setWorkTimer,
  updateCurrency,
  broadcastPetSave,
  stopPetCrawling,
  scheduleCrawlAfterIdle
}) => {
  const sendWorkUpdate = () => {
    const mainWindow = getMainWindow()
    const workWindow = getWorkWindow()
    const activeWork = getActiveWork()

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pet:work-updated', activeWork)
    }

    if (workWindow && !workWindow.isDestroyed()) {
      workWindow.webContents.send('pet:work-updated', activeWork)
    }
  }

  ipcMain.on('pet:start-work', (_event, workOption) => {
    if (getActiveWork()) return

    const workWindow = getWorkWindow()

    if (workWindow && !workWindow.isDestroyed()) {
      workWindow.close()
    }

    stopPetCrawling({
      byUser: false,
      scheduleRestart: false
    })

    const startedAt = Date.now()
    const endsAt = startedAt + workOption.durationSeconds * 1000

    setActiveWork({
      id: workOption.id,
      name: workOption.name,
      currencyReward: workOption.currencyReward,
      startedAt,
      endsAt,
      remainingSeconds: workOption.durationSeconds
    })

    sendWorkUpdate()

    const timer = setInterval(() => {
      const activeWork = getActiveWork()

      if (!activeWork) return

      const remainingMs = activeWork.endsAt - Date.now()
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

      setActiveWork({
        ...activeWork,
        remainingSeconds
      })

      sendWorkUpdate()

      if (remainingSeconds <= 0) {
        clearInterval(getWorkTimer())
        setWorkTimer(null)

        const completedWork = getActiveWork()
        setActiveWork(null)

        if (completedWork) {
          updateCurrency(completedWork.currencyReward)
          broadcastPetSave()
        }

        const mainWindow = getMainWindow()
        const workWindow = getWorkWindow()

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

    setWorkTimer(timer)
  })

  ipcMain.on('pet:cancel-work', () => {
    const workTimer = getWorkTimer()

    if (workTimer) {
      clearInterval(workTimer)
      setWorkTimer(null)
    }

    setActiveWork(null)
    sendWorkUpdate()
    scheduleCrawlAfterIdle()
  })

  ipcMain.handle('pet:get-active-work', () => {
    return getActiveWork()
  })

  ipcMain.on('work:close', () => {
    const workWindow = getWorkWindow()

    if (!workWindow || workWindow.isDestroyed()) return

    workWindow.close()
  })
}

module.exports = {
  registerWorkIpc
}