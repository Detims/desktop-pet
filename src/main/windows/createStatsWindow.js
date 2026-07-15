const path = require('node:path')
const { app, BrowserWindow } = require('electron/main')

const createStatsWindow = ({
  mainWindow,
  preloadPath
}) => {
  const statsWindow = new BrowserWindow({
    width: 240,
    height: 480,
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
      preload: preloadPath,
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
    statsWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), {
      hash: '/stats'
    })
  }

  return statsWindow
}

module.exports = {
  createStatsWindow
}