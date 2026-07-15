import { useEffect, useRef, useState } from 'react'
import type { ActivePetWork } from '../../types/pet'

type PetState =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sleepy'
  | 'alert'

const HOLD_TO_DRAG_MS = 100
const IDLE_BEFORE_CRAWL_MS = 5_000
const STATS_HOVER_DELAY_MS = 800
const TALK_INTERVAL = 30_000

const petAnimations: Record<PetState, string> = {
  idle: '/pet/idle.png',
  happy: '/pet/happy.png',
  sad: '/pet/sad.png',
  angry: '/pet/angry.png',
  sleepy: '/pet/sleepy.png',
  alert: '/pet/alert.png'
}

const CLICK_PHRASES = [
  "What's up?",
  "Whatcha doing?",
  "Need something?",
  "I'm here!",
  "You called?",
  "Need a tiny productivity buddy?"
]

const IDLE_PHRASES = [
  "Don't forget to stretch.",
  "Still here with you.",
  "Need a break?",
  "You got this.",
  "One task at a time.",
  "I believe in you!"
]

function isPetState(value: string): value is PetState {
  return value in petAnimations
}

function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

const formatWorkTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function DesktopPet() {
  const [petState, setPetState] = useState<PetState>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const holdTimerRef = useRef<number | null>(null)
  const isMouseDownRef = useRef(false)
  const isDraggingRef = useRef(false)

  const dragStartMouseRef = useRef({ x: 0, y: 0 })
  const dragStartWindowRef = useRef({ x: 0, y: 0 })

  const idleTimerRef = useRef<number | null>(null)

  const isContextMenuOpenRef = useRef(false)

  const [speechText, setSpeechText] = useState<string | null>(null)
  const speechTimerRef = useRef<number | null>(null)
  const isSpeakingRef = useRef(false)

  const statsHoverTimerRef = useRef<number | null>(null)
  const latestStatsPositionRef = useRef({ x: 0, y: 0 })

  const isHoveringPetRef = useRef(false)
  const isStatsMenuVisibleRef = useRef(false)
  const isStatsMenuWaitingRef = useRef(false)

  const [activeWork, setActiveWork] = useState<ActivePetWork>(null)

  useEffect(() => {
    return window.desktopPet.onPetLeveledUp((event) => {
      setPetState('happy')
      say(`Level up! I'm level ${event.level} now!`)
    })
  }, [])

  useEffect(() => {
    window.desktopPet.getActiveWork().then(setActiveWork)

    return window.desktopPet.onWorkUpdated((nextWork) => {
      setActiveWork(nextWork)
    })
  }, [])

  const cancelStatsMenu = () => {
    isHoveringPetRef.current = false
    isStatsMenuVisibleRef.current = false
    isStatsMenuWaitingRef.current = false

    if (statsHoverTimerRef.current !== null) {
      window.clearTimeout(statsHoverTimerRef.current)
      statsHoverTimerRef.current = null
    }

    window.desktopPet.hideStatsMenu()
}

  useEffect(() => {
    return () => {
      if (statsHoverTimerRef.current !== null) {
        window.clearTimeout(statsHoverTimerRef.current)
        statsHoverTimerRef.current = null
      }
    }
  }, [])

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (isContextMenuOpenRef.current) return
    if (isDraggingRef.current) return
    if (isStatsMenuVisibleRef.current) return
    if (isStatsMenuWaitingRef.current) return

    isHoveringPetRef.current = true
    isStatsMenuVisibleRef.current = false
    isStatsMenuWaitingRef.current = true

    latestStatsPositionRef.current = {
      x: event.screenX,
      y: event.screenY
    }

    if (statsHoverTimerRef.current !== null) {
      window.clearTimeout(statsHoverTimerRef.current)
    }

    statsHoverTimerRef.current = window.setTimeout(() => {
      statsHoverTimerRef.current = null
      isStatsMenuWaitingRef.current = false

      if (!isHoveringPetRef.current) return
      if (isContextMenuOpenRef.current) return
      if (isDraggingRef.current) return
      if (isStatsMenuVisibleRef.current) return

      isStatsMenuVisibleRef.current = true
      window.desktopPet.showStatsMenu(latestStatsPositionRef.current)
    }, STATS_HOVER_DELAY_MS) // Wait half a second before stats menu appears, may need to decrease by <100ms depending on feel
  }

  const handleStatsMouseMove = (event: React.MouseEvent) => {
    latestStatsPositionRef.current = {
      x: event.screenX,
      y: event.screenY
    }

    if (isContextMenuOpenRef.current) return
    if (!isStatsMenuVisibleRef.current) return
    if (isDraggingRef.current) return

    window.desktopPet.moveStatsMenu(latestStatsPositionRef.current)
  }

  const handleMouseLeave = () => {
    cancelStatsMenu()
  }

  // Display a speech bubble for 3 seconds
  const say = (text: string, durationMs = 3000) => {
    if (isSpeakingRef.current) return

    if (speechTimerRef.current !== null) {
      window.clearTimeout(speechTimerRef.current)
      speechTimerRef.current = null
    }

    isSpeakingRef.current = true
    setSpeechText(text)

    speechTimerRef.current = window.setTimeout(() => {
      setSpeechText(null)
      speechTimerRef.current = null
      isSpeakingRef.current = false
    }, durationMs)
  }

  useEffect(() => {
    return () => {
      if (speechTimerRef.current !== null) {
        window.clearTimeout(speechTimerRef.current)
        speechTimerRef.current = null
      }

      isSpeakingRef.current = false
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isDraggingRef.current) return
      if (isSpeakingRef.current) return

      const shouldSpeak = Math.random() < 0.25

      if (!shouldSpeak) return

      say(randomChoice(IDLE_PHRASES), 3500)
    }, TALK_INTERVAL)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    return window.desktopPet.onPetTalk(() => {
      say(randomChoice(CLICK_PHRASES))
    })
  }, [])

  useEffect(() => {
    return window.desktopPet.onContextMenuClosed(() => {
      isContextMenuOpenRef.current = false
    })
  }, [])

  const resetIdleTimer = () => {
    window.desktopPet.stopCrawling()

    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    idleTimerRef.current = window.setTimeout(() => {
      window.desktopPet.startCrawling()
    }, IDLE_BEFORE_CRAWL_MS)
  }

  useEffect(() => {
    resetIdleTimer()

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }

      window.desktopPet.stopCrawling()
    }
  }, [])

  useEffect(() => {
    return window.desktopPet.onPetStateChanged((state) => {
      if (isPetState(state)) {
        setPetState(state)
      }
    })
  }, [])

  // Stop dragging when left click is let go
  const handleMouseUp = () => {
    isMouseDownRef.current = false

    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    const wasDragging = isDraggingRef.current

    isDraggingRef.current = false
    setIsDragging(false)

    if (wasDragging) {
      resetIdleTimer()
      return
    }

    say(randomChoice(CLICK_PHRASES))
    resetIdleTimer()
  }

  // Wait for HOLD_TO_DRAG_MS ms before dragging is allowed
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return

    resetIdleTimer()

    isMouseDownRef.current = true

    dragStartMouseRef.current = {
      x: event.screenX,
      y: event.screenY
    }

    holdTimerRef.current = window.setTimeout(async () => {
      if (!isMouseDownRef.current) return

      const position = await window.desktopPet.getWindowPosition()

      window.desktopPet.stopCrawling()
      cancelStatsMenu()

      dragStartWindowRef.current = position
      isDraggingRef.current = true
      setIsDragging(true)
    }, HOLD_TO_DRAG_MS)
  }

  // Handle pet dragging
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = event.screenX - dragStartMouseRef.current.x
      const deltaY = event.screenY - dragStartMouseRef.current.y

      window.desktopPet.setWindowPosition({
        x: dragStartWindowRef.current.x + deltaX,
        y: dragStartWindowRef.current.y + deltaY
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()

    isContextMenuOpenRef.current = true
    cancelStatsMenu()

    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    resetIdleTimer()
    window.desktopPet.showPetMenu()
  }

  return (
    <div
      className="pet-window"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {speechText && (
        <div className="speech-bubble">
          {speechText}
        </div>
      )}

      {activeWork && (
        <div className="pet-work-overlay">
          <div>
            <strong>{activeWork.name}</strong>
            <span>{formatWorkTime(activeWork.remainingSeconds)} left</span>
          </div>

          <button
            type="button"
            onClick={() => window.desktopPet.cancelWork()}
          >
            Cancel
          </button>
        </div>
      )}

      <img
        key={petState}
        src={petAnimations[petState]}
        alt={`Pet state: ${petState}`}
        className={`pet-image ${isDragging ? 'dragging' : ''}`}
        draggable={false}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleStatsMouseMove}
      />
    </div>
  )
}