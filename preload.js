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
    },

    closeShopWindow: () => {
        ipcRenderer.send('shop:close')
    },

    startWork: (workOption) => {
        ipcRenderer.send('pet:start-work', workOption)
    },

    cancelWork: () => {
        ipcRenderer.send('pet:cancel-work')
    },

    getActiveWork: () => {
        return ipcRenderer.invoke('pet:get-active-work')
    },

    onWorkUpdated: (callback) => {
        const listener = (_event, activeWork) => {
            callback(activeWork)
        }

        ipcRenderer.on('pet:work-updated', listener)

        return () => {
            ipcRenderer.removeListener('pet:work-updated', listener)
        }
    },

    onWorkCompleted: (callback) => {
        const listener = (_event, completedWork) => {
            callback(completedWork)
        }

        ipcRenderer.on('pet:work-completed', listener)

        return () => {
            ipcRenderer.removeListener('pet:work-completed', listener)
        }
    },

    closeWorkWindow: () => {
        ipcRenderer.send('work:close')
    },

    getPetSave: () => {
        return ipcRenderer.invoke('pet:get-save')
    },

    purchaseItem: (item) => {
        return ipcRenderer.invoke('pet:purchase-item', item)
    },

    onPetSaveUpdated: (callback) => {
        const listener = (_event, save) => {
            callback(save)
        }

        ipcRenderer.on('pet:save-updated', listener)

        return () => {
            ipcRenderer.removeListener('pet:save-updated', listener)
        }
    },

    getTasks: () => {
        return ipcRenderer.invoke('pet:get-tasks')
    },

    addTask: (taskInput) => {
        return ipcRenderer.invoke('pet:add-task', taskInput)
    },

    updateTask: (task) => {
        return ipcRenderer.invoke('pet:update-task', task)
    },

    deleteTask: (taskId) => {
        return ipcRenderer.invoke('pet:delete-task', taskId)
    },

    onTasksUpdated: (callback) => {
        const listener = (_event, tasks) => {
            callback(tasks)
        }

        ipcRenderer.on('pet:tasks-updated', listener)

        return () => {
            ipcRenderer.removeListener('pet:tasks-updated', listener)
        }
    },

    closeTasksWindow: () => {
        ipcRenderer.send('tasks:close')
    }
});