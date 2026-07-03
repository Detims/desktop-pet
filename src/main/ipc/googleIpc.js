const { ipcMain } = require('electron/main')
const {
  authorizeGoogle,
  disconnectGoogle,
  getGoogleConnectionStatus,
  getRecentEmails,
  getUpcomingCalendarEvents,
  getGoogleTasks
} = require('../google/googleClient')

const registerGoogleIpc = ({
  getPetSave,
  setGoogleSync,
  clearGoogleSync,
  broadcastGoogleSync
}) => {
  ipcMain.handle('google:get-status', () => {
    return getGoogleConnectionStatus()
  })

  ipcMain.handle('google:connect', async () => {
    try {
      await authorizeGoogle()

      return {
        success: true,
        connected: true
      }
    } catch (error) {
      console.error('Google connect failed:', error)

      return {
        success: false,
        connected: false,
        reason: error instanceof Error ? error.message : 'Google connection failed.'
      }
    }
  })

  ipcMain.handle('google:disconnect', () => {
    try {
      disconnectGoogle()

      const google = clearGoogleSync()
      broadcastGoogleSync()

      return {
        success: true,
        connected: false,
        google
      }
    } catch (error) {
      console.error('Google disconnect failed:', error)

      return {
        success: false,
        connected: getGoogleConnectionStatus().connected,
        google: getPetSave().google,
        reason: error instanceof Error ? error.message : 'Google disconnect failed.'
      }
    }
  })

  ipcMain.handle('google:get-recent-emails', async () => {
    try {
      const emails = await getRecentEmails()

      return {
        success: true,
        emails
      }
    } catch (error) {
      console.error('Failed to fetch recent emails:', error)

      return {
        success: false,
        emails: [],
        reason: error instanceof Error ? error.message : 'Failed to fetch recent emails.'
      }
    }
  })

  ipcMain.handle('google:get-calendar-events', async () => {
    try {
      const events = await getUpcomingCalendarEvents()

      return {
        success: true,
        events
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error)

      return {
        success: false,
        events: [],
        reason: error instanceof Error ? error.message : 'Failed to fetch calendar events.'
      }
    }
  })

  ipcMain.handle('google:get-tasks', async () => {
    try {
      const tasks = await getGoogleTasks()

      return {
        success: true,
        tasks
      }
    } catch (error) {
      console.error('Failed to fetch Google tasks:', error)

      return {
        success: false,
        tasks: [],
        reason: error instanceof Error ? error.message : 'Failed to fetch Google tasks.'
      }
    }
  })

  ipcMain.handle('google:get-latest-sync', () => {
    return getPetSave().google
  })

  ipcMain.handle('google:sync-all', async () => {
    try {
      const [emails, calendarEvents, tasks] = await Promise.all([
        getRecentEmails(),
        getUpcomingCalendarEvents(),
        getGoogleTasks()
      ])

      const googleSync = setGoogleSync({
        emails,
        calendarEvents,
        tasks
      })

      broadcastGoogleSync()

      return {
        success: true,
        google: googleSync
      }
    } catch (error) {
      console.error('Failed to sync Google data:', error)

      return {
        success: false,
        google: getPetSave().google,
        reason: error instanceof Error ? error.message : 'Failed to sync Google data.'
      }
    }
  })
}

module.exports = {
  registerGoogleIpc
}