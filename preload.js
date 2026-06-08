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
    }
});