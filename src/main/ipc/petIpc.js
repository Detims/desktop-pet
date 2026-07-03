const { BrowserWindow, ipcMain } = require('electron/main')

const registerPetIpc = ({
  getMainWindow,
  getPetMenu,
  getPetSave,
  setContextMenuOpen,
  getStatsWindow,
  startPetCrawling,
  stopPetCrawling,
  setCrawlPosition
}) => {
  ipcMain.on('pet:show-context-menu', () => {
    const mainWindow = getMainWindow()
    const statsWindow = getStatsWindow()
    const petMenu = getPetMenu()

    if (!mainWindow || mainWindow.isDestroyed() || !petMenu) return

    setContextMenuOpen(true)

    if (statsWindow && !statsWindow.isDestroyed()) {
      statsWindow.hide()
    }

    petMenu.popup({
      window: mainWindow,
      callback: () => {
        setContextMenuOpen(false)

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet:context-menu-closed')
        }
      }
    })
  })

  ipcMain.handle('pet:get-window-position', () => {
    const mainWindow = getMainWindow()
    const win = BrowserWindow.getFocusedWindow() || mainWindow

    if (!win) {
      return { x: 0, y: 0 }
    }

    const [x, y] = win.getPosition()
    return { x, y }
  })

  ipcMain.on('pet:set-window-position', (_event, position) => {
    const mainWindow = getMainWindow()
    const win = BrowserWindow.getFocusedWindow() || mainWindow

    if (!win) return

    const nextX = Math.round(position.x)
    const nextY = Math.round(position.y)

    win.setPosition(nextX, nextY)

    setCrawlPosition({
      x: nextX,
      y: nextY
    })
  })

  ipcMain.on('pet:start-crawling', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) startPetCrawling(mainWindow)
  })

  ipcMain.on('pet:stop-crawling', () => {
    stopPetCrawling({
      byUser: true,
      scheduleRestart: false
    })
  })

  ipcMain.handle('pet:get-save', () => {
    return getPetSave()
  })
}

module.exports = {
  registerPetIpc
}