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
}

export type PurchaseResult = {
  success: boolean
  reason?: string
  save: PetSave
}