const { ipcMain } = require('electron/main')

const registerStatsIpc = ({
  getStatsWindow,
  isContextMenuOpen
}) => {
  ipcMain.on('pet:show-stats-menu', (_event, position) => {
    const statsWindow = getStatsWindow()

    if (isContextMenuOpen()) return
    if (!statsWindow || statsWindow.isDestroyed()) return

    statsWindow.setPosition(
      Math.round(position.x),
      Math.round(position.y)
    )

    statsWindow.showInactive()
  })

  ipcMain.on('pet:move-stats-menu', (_event, position) => {
    const statsWindow = getStatsWindow()

    if (isContextMenuOpen()) return
    if (!statsWindow || statsWindow.isDestroyed()) return
    if (!statsWindow.isVisible()) return

    statsWindow.setPosition(
      Math.round(position.x),
      Math.round(position.y)
    )
  })

  ipcMain.on('pet:hide-stats-menu', () => {
    const statsWindow = getStatsWindow()

    if (!statsWindow || statsWindow.isDestroyed()) return

    statsWindow.hide()
  })
}

module.exports = {
  registerStatsIpc
}