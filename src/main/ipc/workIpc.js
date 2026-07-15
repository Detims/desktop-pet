const { ipcMain } = require('electron/main')

const registerWorkIpc = ({ getWorkWindow, workController }) => {
  ipcMain.on('pet:start-work', (_event, workOption) => {
    workController.startWork(workOption)
  })

  ipcMain.on('pet:cancel-work', () => {
    workController.cancelWork()
  })

  ipcMain.handle('pet:get-active-work', () => {
    return workController.getActiveWork()
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
