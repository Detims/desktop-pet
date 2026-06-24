const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { shell, app } = require('electron')
const { google } = require('googleapis')

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly'
]

const getGoogleCredentialsPath = () => {
  return path.join(__dirname, 'google-oauth-client.json')
}

const getGoogleTokenPath = () => {
  return path.join(app.getPath('userData'), 'google-token.json')
}

const loadGoogleCredentials = () => {
  const credentialsPath = getGoogleCredentialsPath()

  if (!fs.existsSync(credentialsPath)) {
    throw new Error('Missing google-oauth-client.json')
  }

  const rawCredentials = fs.readFileSync(credentialsPath, 'utf8')
  const credentials = JSON.parse(rawCredentials)

  return credentials.installed ?? credentials
}

const saveGoogleToken = (tokens) => {
  fs.writeFileSync(
    getGoogleTokenPath(),
    JSON.stringify(tokens, null, 2),
    'utf8'
  )
}

const loadGoogleToken = () => {
  const tokenPath = getGoogleTokenPath()

  if (!fs.existsSync(tokenPath)) {
    return null
  }

  const rawToken = fs.readFileSync(tokenPath, 'utf8')
  return JSON.parse(rawToken)
}

const createOAuthClient = (redirectUri) => {
  const credentials = loadGoogleCredentials()

  return new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    redirectUri
  )
}

const waitForOAuthCode = (server) => {
  return new Promise((resolve, reject) => {
    server.on('request', (request, response) => {
      try {
        const requestUrl = new URL(request.url, 'http://127.0.0.1')

        const code = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')

        if (error) {
          response.writeHead(400, { 'Content-Type': 'text/html' })
          response.end('<h1>Google authorization failed.</h1>')
          reject(new Error(error))
          return
        }

        if (!code) {
          response.writeHead(400, { 'Content-Type': 'text/html' })
          response.end('<h1>No authorization code received.</h1>')
          reject(new Error('No authorization code received.'))
          return
        }

        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end(`
          <h1>Google connected!</h1>
          <p>You can close this browser tab and return to the desktop pet app.</p>
        `)

        resolve(code)
      } catch (error) {
        reject(error)
      } finally {
        server.close()
      }
    })
  })
}

const authorizeGoogle = async () => {
  const existingToken = loadGoogleToken()

  if (existingToken) {
    const oauthClient = createOAuthClient('http://127.0.0.1')
    oauthClient.setCredentials(existingToken)
    return oauthClient
  }

  const server = http.createServer()

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    server.close()
    throw new Error('Could not start local OAuth server.')
  }

  const redirectUri = `http://127.0.0.1:${address.port}`
  const oauthClient = createOAuthClient(redirectUri)

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })

  await shell.openExternal(authUrl)

  const code = await waitForOAuthCode(server)
  const tokenResponse = await oauthClient.getToken(code)

  oauthClient.setCredentials(tokenResponse.tokens)
  saveGoogleToken(tokenResponse.tokens)

  return oauthClient
}

const disconnectGoogle = async () => {
  setIsLoading(true)
  setMessage(null)

  const result = await window.desktopPet.disconnectGoogle()

  setIsConnected(result.connected)

  if (result.google) {
    applyGoogleSync(result.google)
  }

  setMessage(result.success ? 'Google disconnected.' : result.reason ?? 'Could not disconnect Google.')
  setIsLoading(false)
}

const getGoogleConnectionStatus = () => {
  return {
    connected: fs.existsSync(getGoogleTokenPath())
  }
}

const getRecentEmails = async () => {
  const auth = await authorizeGoogle()
  const gmail = google.gmail({ version: 'v1', auth })

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10,
    q: 'newer_than:14d'
  })

  const messages = listResponse.data.messages ?? []

  const hydratedMessages = await Promise.all(
    messages.map(async (message) => {
      const detailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      })

      const headers = detailResponse.data.payload?.headers ?? []

      const getHeader = (name) => {
        return headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
      }

      return {
        id: detailResponse.data.id,
        threadId: detailResponse.data.threadId,
        from: getHeader('From'),
        subject: getHeader('Subject') || '(No subject)',
        date: getHeader('Date'),
        snippet: detailResponse.data.snippet ?? ''
      }
    })
  )

  return hydratedMessages
}

const getUpcomingCalendarEvents = async () => {
  const auth = await authorizeGoogle()
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  })

  return (response.data.items ?? []).map((event) => ({
    id: event.id,
    title: event.summary ?? '(No title)',
    description: event.description ?? '',
    location: event.location ?? '',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? ''
  }))
}

const getGoogleTasks = async () => {
  const auth = await authorizeGoogle()
  const tasksApi = google.tasks({ version: 'v1', auth })

  const taskListsResponse = await tasksApi.tasklists.list({
    maxResults: 10
  })

  const taskLists = taskListsResponse.data.items ?? []

  const allTasks = []

  for (const taskList of taskLists) {
    if (!taskList.id) continue

    const tasksResponse = await tasksApi.tasks.list({
      tasklist: taskList.id,
      maxResults: 20,
      showCompleted: false
    })

    const tasks = tasksResponse.data.items ?? []

    for (const task of tasks) {
      allTasks.push({
        id: task.id,
        listId: taskList.id,
        listTitle: taskList.title ?? 'Tasks',
        title: task.title ?? '(No title)',
        notes: task.notes ?? '',
        due: task.due ?? '',
        status: task.status ?? ''
      })
    }
  }

  return allTasks
}

module.exports = {
  authorizeGoogle,
  disconnectGoogle,
  getGoogleConnectionStatus,
  getRecentEmails,
  getUpcomingCalendarEvents,
  getGoogleTasks
}