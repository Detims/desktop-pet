const { app, BrowserWindow } = require('electron/main')
const { createDesktopPetApp } = require('./src/main/app')

const desktopPetApp = createDesktopPetApp()

app.whenReady().then(() => {
  desktopPetApp.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      desktopPetApp.start()
    }
  })
})

app.on('window-all-closed', () => {
  desktopPetApp.destroy()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})