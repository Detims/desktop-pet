const { Menu } = require('electron/main')

const PET_STATES = [
  'idle',
  'happy',
  'sad',
  'angry',
  'sleepy',
  'alert'
]

const hideStatsWindow = (getStatsWindow) => {
  const statsWindow = getStatsWindow()

  if (statsWindow && !statsWindow.isDestroyed()) {
    statsWindow.hide()
  }
}

const createPetContextMenu = ({
  getMainWindow,
  getStatsWindow,
  openShopWindow,
  openWorkWindow,
  openTasksWindow
}) => {
  return Menu.buildFromTemplate([
    {
      label: 'Emotions',
      submenu: PET_STATES.map((state) => ({
        label: state.charAt(0).toUpperCase() + state.slice(1),
        click: () => {
          const mainWindow = getMainWindow()

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pet:set-state', state)
          }
        }
      }))
    },
    {
      label: 'Talk',
      click: () => {
        const mainWindow = getMainWindow()

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet:talk')
        }
      }
    },
    {
      label: 'Shop',
      click: () => {
        hideStatsWindow(getStatsWindow)
        openShopWindow()
      }
    },
    {
      label: 'Work',
      click: () => {
        hideStatsWindow(getStatsWindow)
        openWorkWindow()
      }
    },
    {
      label: 'Tasks',
      click: () => {
        hideStatsWindow(getStatsWindow)
        openTasksWindow()
      }
    },
    {
      label: 'Exit',
      click: () => {
        const mainWindow = getMainWindow()

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.close()
        }
      }
    }
  ])
}

module.exports = {
  PET_STATES,
  createPetContextMenu
}
