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