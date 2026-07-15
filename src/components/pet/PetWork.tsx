import { useEffect, useState } from 'react'
import { PET_WORK_OPTIONS } from './PetWorkOptions'

type ActiveWork = {
  id: string
  name: string
  xpReward: number,
  currencyReward: number
  startedAt: number
  endsAt: number
  remainingSeconds: number
} | null

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function PetWork() {
  const [coins, setCoins] = useState(0)
  const [level, setLevel] = useState(1)
  const [activeWork, setActiveWork] = useState<ActiveWork>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    window.desktopPet.getPetSave().then((save) => {
      setLevel(save.level)
    })

    return window.desktopPet.onPetSaveUpdated((save) => {
      setLevel(save.level)
    })
  }, [])

  useEffect(() => {
    window.desktopPet.getPetSave().then((save) => {
      setCoins(save.currency)
    })

    return window.desktopPet.onPetSaveUpdated((save) => {
      setCoins(save.currency)
    })
  }, [])

  useEffect(() => {
    window.desktopPet.getActiveWork().then(setActiveWork)

    const removeWorkUpdated = window.desktopPet.onWorkUpdated((nextWork) => {
      setActiveWork(nextWork)
    })

    const removeWorkCompleted = window.desktopPet.onWorkCompleted((completedWork) => {
      setMessage(`Completed ${completedWork.name}! Earned ${completedWork.currencyReward} coins.`)
    })

    return () => {
      removeWorkUpdated()
      removeWorkCompleted()
    }
  }, [])

  return (
    <main className="work-window">
      <div className="shop-titlebar">
        <div className="shop-titlebar-drag-region">
          <span className="shop-titlebar-icon">💼</span>
          <span className="shop-titlebar-title">Pet Work</span>
        </div>

        <div className="shop-titlebar-actions">
          <button
            type="button"
            aria-label="Close work"
            onClick={() => window.desktopPet.closeWorkWindow()}
          >
            ×
          </button>
        </div>
      </div>

      <section className="work-content">
        <header className="work-header">
          <div>
            <h1>Work</h1>
            <p>Send your pet to work to earn coins.</p>
          </div>

          <div className="coin-display">
            <span className="coin-icon">●</span>
            <span>{coins}</span>
          </div>
        </header>

        {message && (
          <div className="work-message">
            {message}
          </div>
        )}

        {activeWork && (
          <section className="active-work-card">
            <div>
              <h2>{activeWork.name}</h2>
              <p>Time left: {formatTime(activeWork.remainingSeconds)}</p>
            </div>

            <button
              type="button"
              onClick={() => window.desktopPet.cancelWork()}
            >
              Cancel
            </button>
          </section>
        )}

        <section className="work-grid">
          {PET_WORK_OPTIONS.map((work) => {
            const isLocked = level < work.requiredLevel
            const isBusy = activeWork !== null

            return (
              <article key={work.id} className="work-card">
                <div>
                  <h2>{work.name}</h2>
                  <p>{work.description}</p>
                </div>

                <div className="work-card-details">
                  <span>Level {work.requiredLevel}+</span>
                  <span>{formatTime(work.durationSeconds)}</span>
                  <span>{work.currencyReward} coins</span>
                </div>

                <div className="work-rewards">
                  <span>+{work.currencyReward} coins</span>
                  <span>+{work.xpReward} XP</span>
                </div>

                <button
                  type="button"
                  disabled={isLocked || isBusy}
                  onClick={() => window.desktopPet.startWork(work)}
                >
                  {isLocked ? `Requires Lv. ${work.requiredLevel}` : isBusy ? 'Pet is busy' : 'Start Work'}
                </button>
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}