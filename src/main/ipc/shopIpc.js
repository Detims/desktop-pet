const { ipcMain } = require('electron/main')

const registerShopIpc = ({
  getShopWindow,
  getPetSave,
  updateCurrency,
  broadcastPetSave
}) => {
  ipcMain.on('shop:close', () => {
    const shopWindow = getShopWindow()

    if (!shopWindow || shopWindow.isDestroyed()) return

    shopWindow.close()
  })

  ipcMain.handle('pet:purchase-item', (_event, item) => {
    const save = getPetSave()

    if (!item || typeof item.price !== 'number') {
      return {
        success: false,
        reason: 'Invalid item.',
        save
      }
    }

    if (save.currency < item.price) {
      return {
        success: false,
        reason: 'Not enough currency.',
        save
      }
    }

    const nextSave = updateCurrency(-item.price)
    broadcastPetSave()

    return {
      success: true,
      save: nextSave
    }
  })
}

module.exports = {
  registerShopIpc
}