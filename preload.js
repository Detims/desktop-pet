const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopPet', {
    showPetMenu: () => {
        ipcRenderer.send('pet:show-context-menu');
    },

    onPetStateChanged: (callback) => {
        const listener = (_event, state) => {
            callback(state);
        }

        ipcRenderer.on('pet:set-state', listener);

        return () => {
            ipcRenderer.removeListener('pet:set-state', listener);
        }
    },

    getWindowPosition: () => {
        return ipcRenderer.invoke('pet:get-window-position');
    },

    setWindowPosition: (position) => {
        ipcRenderer.send('pet:set-window-position', position);
    },
    
    startCrawling: () => {
        ipcRenderer.send('pet:start-crawling')
    },

    stopCrawling: () => {
        ipcRenderer.send('pet:stop-crawling')
    },

    onContextMenuClosed: (callback) => {
        const listener = () => {
            callback()
        }

        ipcRenderer.on('pet:context-menu-closed', listener)

        return () => {
            ipcRenderer.removeListener('pet:context-menu-closed', listener)
        }
    },

    onPetTalk: (callback) => {
        const listener = () => {
            callback()
        }

        ipcRenderer.on('pet:talk', listener)

        return () => {
            ipcRenderer.removeListener('pet:talk', listener)
        }
    },

    showStatsMenu: (position) => {
        ipcRenderer.send('pet:show-stats-menu', position)
    },

    moveStatsMenu: (position) => {
        ipcRenderer.send('pet:move-stats-menu', position)
    },

    hideStatsMenu: () => {
        ipcRenderer.send('pet:hide-stats-menu')
    }
});