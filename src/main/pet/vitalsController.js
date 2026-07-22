const TICK_INTERVAL_MS = 60_000

const createVitalsController = ({
  decayPetStats,
  updatePetStats,
  getPetSave,
  broadcastPetSave,
  getMainWindow
}) => {
  let vitalsTimer = null

  const emitVitalsReaction = (stats) => {
    const mainWindow = getMainWindow()

    if (!mainWindow || mainWindow.isDestroyed()) return

    if (stats.health <= 20) {
      mainWindow.webContents.send('pet:vitals-alert', {
        type: 'health',
        message: "I don't feel good..."
      })
      return
    }

    if (stats.thirst <= 20) {
      mainWindow.webContents.send('pet:vitals-alert', {
        type: 'thirst',
        message: "I'm thirsty..."
      })
      return
    }

    if (stats.hunger <= 20) {
      mainWindow.webContents.send('pet:vitals-alert', {
        type: 'hunger',
        message: "I'm hungry..."
      })
      return
    }

    if (stats.energy <= 20) {
      mainWindow.webContents.send('pet:vitals-alert', {
        type: 'energy',
        message: "I'm tired..."
      })
      return
    }

    if (stats.mood <= 20) {
      mainWindow.webContents.send('pet:vitals-alert', {
        type: 'mood',
        message: "I'm feeling down..."
      })
    }
  }

  const tick = () => {
    const stats = decayPetStats()

    broadcastPetSave()
    emitVitalsReaction(stats)

    return getPetSave()
  }

  const start = () => {
    if (vitalsTimer) return

    tick()

    vitalsTimer = setInterval(() => {
      tick()
    }, TICK_INTERVAL_MS)
  }

  const stop = () => {
    if (!vitalsTimer) return

    clearInterval(vitalsTimer)
    vitalsTimer = null
  }

  const applyEffects = (effects) => {
    const stats = updatePetStats(effects)

    broadcastPetSave()
    emitVitalsReaction(stats)

    return stats
  }

  const destroy = () => {
    stop()
  }

  return {
    start,
    stop,
    tick,
    applyEffects,
    destroy
  }
}

module.exports = {
  createVitalsController
}