export type WindowPosition = {
  x: number
  y: number
}

export type PetWorkOption = {
  id: string
  name: string
  description: string
  durationSeconds: number
  currencyReward: number
  requiredLevel: number
}

export type ActivePetWork = {
  id: string
  name: string
  currencyReward: number
  startedAt: number
  endsAt: number
  remainingSeconds: number
} | null

export type PetSave = {
  currency: number
  level: number
  tasks: PetTask[]
}

export type PurchaseResult = {
  success: boolean
  reason?: string
  save: PetSave
}

export type PetTask = {
  id: string
  title: string
  notes: string
  completed: boolean
  createdAt: number
}

export type AddTaskInput = {
  title: string
  notes: string
}

export type TaskResult = {
  success: boolean
  reason?: string
  task?: PetTask
  tasks: PetTask[]
}

export type GoogleStatus = {
  connected: boolean
}

export type GoogleConnectionResult = {
  success: boolean
  connected: boolean
  reason?: string
}

export type GoogleEmail = {
  id?: string | null
  threadId?: string | null
  from: string
  subject: string
  date: string
  snippet: string
}

export type GoogleCalendarEvent = {
  id?: string | null
  title: string
  description: string
  location: string
  start: string
  end: string
}

export type GoogleTask = {
  id?: string | null
  listId: string
  listTitle: string
  title: string
  notes: string
  due: string
  status: string
}

export type GoogleEmailsResult = {
  success: boolean
  emails: GoogleEmail[]
  reason?: string
}

export type GoogleCalendarEventsResult = {
  success: boolean
  events: GoogleCalendarEvent[]
  reason?: string
}

export type GoogleTasksResult = {
  success: boolean
  tasks: GoogleTask[]
  reason?: string
}