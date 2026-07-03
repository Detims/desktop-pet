const path = require('node:path')
const { app, BrowserWindow } = require('electron/main')

const createMainWindow = ({
  preloadPath
}) => {
  const mainWindow = new BrowserWindow({
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
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'))
  }

  return mainWindow
}

module.exports = {
  createMainWindow
}