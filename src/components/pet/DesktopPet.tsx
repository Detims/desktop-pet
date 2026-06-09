import { useEffect, useRef, useState } from 'react'

type PetState =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sleepy'
  | 'alert'

const HOLD_TO_DRAG_MS = 100
const IDLE_BEFORE_CRAWL_MS = 5_000
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

export function DesktopPet() {
  const [petState, setPetState] = useState<PetState>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const holdTimerRef = useRef<number | null>(null)
  const isMouseDownRef = useRef(false)
  const isDraggingRef = useRef(false)

  const dragStartMouseRef = useRef({ x: 0, y: 0 })
  const dragStartWindowRef = useRef({ x: 0, y: 0 })

  const idleTimerRef = useRef<number | null>(null)

  const [speechText, setSpeechText] = useState<string | null>(null)
  const speechTimerRef = useRef<number | null>(null)
  const isSpeakingRef = useRef(false)

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

    resetIdleTimer()

    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    window.desktopPet.showPetMenu()
  }

  return (
    <div
    className="pet-window"
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    onContextMenu={handleContextMenu}
  >
    {speechText && (
      <div className="speech-bubble">
        {speechText}
      </div>
    )}

    <img
      key={petState}
      src={petAnimations[petState]}
      alt={`Pet state: ${petState}`}
      className={`pet-image ${isDragging ? 'dragging' : ''}`}
      draggable={false}
    />
  </div>
  )
}