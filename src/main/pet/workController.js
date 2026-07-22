const createWorkController = ({
  getMainWindow,
  getWorkWindow,
  updateCurrency,
  addXP,
  updatePetStats,
  broadcastPetSave,
  stopPetCrawling,
  scheduleCrawlAfterIdle
}) => {
  let activeWork = null
  let workTimer = null

  const sendWorkUpdate = () => {
    const mainWindow = getMainWindow()
    const workWindow = getWorkWindow()

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pet:work-updated', activeWork)
    }

    if (workWindow && !workWindow.isDestroyed()) {
      workWindow.webContents.send('pet:work-updated', activeWork)
    }
  }

  const completeWork = () => {
    if (workTimer) {
      clearInterval(workTimer)
      workTimer = null
    }

    const mainWindow = getMainWindow()
    const workWindow = getWorkWindow()

    const completedWork = activeWork
    activeWork = null

    if (completedWork) {
      updateCurrency(completedWork.currencyReward)

      const xpResult = addXP(completedWork.xpReward ?? 0)

      updatePetStats({
        mood: 8,
        energy: -5,
        hunger: -3,
        thirst: -5
      })

      broadcastPetSave()

      if (xpResult.leveledUp && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('pet:leveled-up', {
          level: xpResult.save.level,
          levelsGained: xpResult.levelsGained,
          xpGained: xpResult.xpGained
        })
      }
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

  const startWork = (workOption) => {
    if (activeWork) return

    const workWindow = getWorkWindow()

    if (workWindow && !workWindow.isDestroyed()) {
      workWindow.close()
    }

    stopPetCrawling({
      byUser: false,
      scheduleRestart: false
    })

    updatePetStats({
      energy: -5,
      mood: -1
    })

    broadcastPetSave()

    const startedAt = Date.now()
    const endsAt = startedAt + workOption.durationSeconds * 1000

    activeWork = {
      id: workOption.id,
      name: workOption.name,
      xpReward: workOption.xpReward,
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
        completeWork()
      }
    }, 1000)
  }

  const cancelWork = () => {
    if (workTimer) {
      clearInterval(workTimer)
      workTimer = null
    }

    activeWork = null
    sendWorkUpdate()
    scheduleCrawlAfterIdle()
  }

  const getActiveWork = () => {
    return activeWork
  }

  const destroy = () => {
    if (workTimer) {
      clearInterval(workTimer)
      workTimer = null
    }

    activeWork = null
  }

  return {
    startWork,
    cancelWork,
    getActiveWork,
    destroy
  }
}

module.exports = {
  createWorkController
}
