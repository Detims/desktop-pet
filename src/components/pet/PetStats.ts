export type PetStat = {
  label: string
  value: number
  max: number
}

export const PET_STATS: PetStat[] = [
  { label: 'Level', value: 1, max: 99 },
  { label: 'Currency', value: 100, max: 999 },
  { label: 'Health', value: 85, max: 100 },
  { label: 'Hunger', value: 62, max: 100 },
  { label: 'Thirst', value: 40, max: 100 },
  { label: 'Energy', value: 73, max: 100 },
  { label: 'Mood', value: 90, max: 100 }
]