const path = require('node:path')
const { app, BrowserWindow } = require('electron/main')
const { getWindowBounds, setWindowBounds } = require('../state/petSaveStore')
const { ensureWindowBoundsAreVisible } = require('./windowBounds')

const createUtilityWindow = ({
  existingWindow,
  setWindow,
  windowName,
  hash,
  preloadPath,
  options = {}
}) => {
  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus()
    return existingWindow
  }

  const bounds = ensureWindowBoundsAreVisible(
    getWindowBounds(windowName, {
      width: 720,
      height: 520
    })
  )

  const utilityWindow = new BrowserWindow({
    ...bounds,
    minWidth: 520,
    minHeight: 420,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundColor: '#111827',
    ...options,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      ...(options.webPreferences ?? {})
    }
  })

  setWindow(utilityWindow)

  utilityWindow.setMenuBarVisibility(false)

  utilityWindow.on('close', () => {
    if (!utilityWindow || utilityWindow.isDestroyed()) return
    setWindowBounds(windowName, utilityWindow.getBounds())
  })

  utilityWindow.on('closed', () => {
    setWindow(null)
  })

  if (!app.isPackaged) {
    utilityWindow.loadURL(`http://127.0.0.1:5173/#/${hash}`)
  } else {
    utilityWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), {
      hash: `/${hash}`
    })
  }

  return utilityWindow
}

module.exports = {
  createUtilityWindow
}