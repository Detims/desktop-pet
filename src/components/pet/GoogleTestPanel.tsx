import { useEffect, useState } from 'react'
import type {
  GoogleCalendarEvent,
  GoogleEmail,
  GoogleTask
} from '../../types/pet'

export function GoogleTestPanel() {
  const [isConnected, setIsConnected] = useState(false)
  const [emails, setEmails] = useState<GoogleEmail[]>([])
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const applyGoogleSync = (googleSync: {
    lastSyncedAt: number | null
    emails: GoogleEmail[]
    calendarEvents: GoogleCalendarEvent[]
    tasks: GoogleTask[]
  }) => {
    setLastSyncedAt(googleSync.lastSyncedAt)
    setEmails(googleSync.emails)
    setEvents(googleSync.calendarEvents)
    setGoogleTasks(googleSync.tasks)
  }

  useEffect(() => {
    window.desktopPet.getGoogleStatus().then((status) => {
      setIsConnected(status.connected)
    })

    window.desktopPet.getLatestGoogleSync().then(applyGoogleSync)

    return window.desktopPet.onGoogleSyncUpdated((googleSync) => {
      applyGoogleSync(googleSync)
    })
  }, [])

  const connectGoogle = async () => {
    setIsLoading(true)
    setMessage(null)

    const result = await window.desktopPet.connectGoogle()

    setIsConnected(result.connected)
    setMessage(result.success ? 'Google connected.' : result.reason ?? 'Could not connect Google.')
    setIsLoading(false)
  }

  const syncGoogleData = async () => {
    setIsLoading(true)
    setMessage(null)

    const result = await window.desktopPet.syncGoogleData()

    if (result.success) {
      applyGoogleSync(result.google)
      setMessage('Google data synced.')
    } else {
      applyGoogleSync(result.google)
      setMessage(result.reason ?? 'Could not sync Google data.')
    }

    setIsLoading(false)
  }

  return (
    <section className="google-panel">
      <div className="google-panel-header">
        <div>
          <h2>Google API Test</h2>
          <p>{isConnected ? 'Connected' : 'Not connected'}</p>

          {lastSyncedAt && (
            <p>
              Last synced: {new Date(lastSyncedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="google-panel-actions">
          {!isConnected ? (
            <button type="button" onClick={connectGoogle} disabled={isLoading}>
              Connect Google
            </button>
          ) : (
              <button type="button" onClick={syncGoogleData} disabled={isLoading}>
                Sync
              </button>
          )}
        </div>
      </div>

      {message && (
        <div className="google-message">
          {message}
        </div>
      )}

      <div className="google-results">
        <section>
          <h3>Recent Emails</h3>

          {emails.length === 0 ? (
            <p>No emails loaded.</p>
          ) : (
            emails.map((email) => (
              <article key={email.id ?? email.subject} className="google-result-card">
                <strong>{email.subject}</strong>
                <span>{email.from}</span>
                <p>{email.snippet}</p>
              </article>
            ))
          )}
        </section>

        <section>
          <h3>Calendar Events</h3>

          {events.length === 0 ? (
            <p>No events loaded.</p>
          ) : (
            events.map((event) => (
              <article key={event.id ?? event.title} className="google-result-card">
                <strong>{event.title}</strong>
                <span>{event.start}</span>
                {event.location && <p>{event.location}</p>}
              </article>
            ))
          )}
        </section>

        <section>
          <h3>Google Tasks</h3>

          {googleTasks.length === 0 ? (
            <p>No Google tasks loaded.</p>
          ) : (
            googleTasks.map((task) => (
              <article key={task.id ?? task.title} className="google-result-card">
                <strong>{task.title}</strong>
                <span>{task.listTitle}</span>
                {task.notes && <p>{task.notes}</p>}
              </article>
            ))
          )}
        </section>
      </div>
    </section>
  )
}