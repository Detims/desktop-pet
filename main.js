const path = require('node:path');
const { app, BrowserWindow, ipcMain, Menu } = require('electron/main');

let mainWindow = null;

const PET_STATES = [
  'idle',
  'happy',
  'sad',
  'angry',
  'sleepy',
  'alert'
];

const createPetContextMenu = (win) => {
    return Menu.buildFromTemplate(
        PET_STATES.map((state) => ({
            label: state.charAt(0).toUpperCase() + state.slice(1),
            click: () => {
                win.webContents.send('pet:set-state', state);
            }
        }))
    );
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Keep pet above normal windows and fullscreen apps
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }) // MacOS

  const petMenu = createPetContextMenu(mainWindow);

  ipcMain.on('pet:show-context-menu', () => {
    petMenu.popup({
      window: mainWindow
    })
  });

  ipcMain.handle('pet:get-window-position', () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;

    if (!win) {
      return { x: 0, y: 0 }
    }

    const [x, y] = win.getPosition()
    return { x, y }
  });

  ipcMain.on('pet:set-window-position', (_event, position) => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;

    if (!win) return;

    win.setPosition(Math.round(position.x), Math.round(position.y));
  });

  // Run npm run dev, open new terminal, npm run start
  if (!app.isPackaged) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})