const { registerPetIpc } = require('./petIpc')
const { registerStatsIpc } = require('./statsIpc')
const { registerShopIpc } = require('./shopIpc')
const { registerWorkIpc } = require('./workIpc')
const { registerTasksIpc } = require('./tasksIpc')
const { registerGoogleIpc } = require('./googleIpc')

const registerIpcHandlers = (context) => {
    registerPetIpc(context)
    registerStatsIpc(context)
    registerShopIpc(context)
    registerWorkIpc(context)
    registerTasksIpc(context)
    registerGoogleIpc(context)
}

module.exports = {
    registerIpcHandlers
}