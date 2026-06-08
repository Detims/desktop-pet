import { useEffect, useRef, useState } from 'react'

type PetState =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sleepy'
  | 'alert'

const petAnimations: Record<PetState, string> = {
  idle: '/pet/idle.png',
  happy: '/pet/happy.png',
  sad: '/pet/sad.png',
  angry: '/pet/angry.png',
  sleepy: '/pet/sleepy.png',
  alert: '/pet/alert.png'
}

function isPetState(value: string): value is PetState {
  return value in petAnimations
}

const HOLD_TO_DRAG_MS = 100

export function DesktopPet() {
  const [petState, setPetState] = useState<PetState>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const holdTimerRef = useRef<number | null>(null)
  const isMouseDownRef = useRef(false)
  const isDraggingRef = useRef(false)

  const dragStartMouseRef = useRef({ x: 0, y: 0 })
  const dragStartWindowRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    return window.desktopPet.onPetStateChanged((state) => {
      if (isPetState(state)) {
        setPetState(state)
      }
    })
  }, [])

  useEffect(() => {
    // Handle pet dragging
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = event.screenX - dragStartMouseRef.current.x
      const deltaY = event.screenY - dragStartMouseRef.current.y

      window.desktopPet.setWindowPosition({
        x: dragStartWindowRef.current.x + deltaX,
        y: dragStartWindowRef.current.y + deltaY
      })
    }

    // Stop dragging when left click is let go
    const handleMouseUp = () => {
      isMouseDownRef.current = false

      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }

      isDraggingRef.current = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Wait for HOLD_TO_DRAG_MS ms before dragging is allowed
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return

    isMouseDownRef.current = true

    dragStartMouseRef.current = {
      x: event.screenX,
      y: event.screenY
    }

    holdTimerRef.current = window.setTimeout(async () => {
      if (!isMouseDownRef.current) return

      const position = await window.desktopPet.getWindowPosition()

      dragStartWindowRef.current = position
      isDraggingRef.current = true
      setIsDragging(true)
    }, HOLD_TO_DRAG_MS)
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()

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
      onContextMenu={handleContextMenu}
    >
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