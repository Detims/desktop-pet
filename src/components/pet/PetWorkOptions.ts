export type PetworkOption = {
    id: string
    name: string
    description: string
    durationSeconds: number
    xpReward: number
    currencyReward: number
    requiredLevel: number
}

export const PET_WORK_OPTIONS: PetworkOption[] = [
    {
        id: 'organize-desk',
        name: 'Organize Desk',
        description: 'A short task that earns a small reward.',
        durationSeconds: 30,
        xpReward: 15,
        currencyReward: 10,
        requiredLevel: 1
    },
    {
        id: 'sort-emails',
        name: 'Sort Emails',
        description: 'Help clean up recent emails.',
        durationSeconds: 60,
        xpReward: 35,
        currencyReward: 25,
        requiredLevel: 2
    },
    {
        id: 'calendar-planning',
        name: 'Calendar Planning',
        description: 'Review upcoming calendar events.',
        durationSeconds: 120,
        xpReward: 70,
        currencyReward: 50,
        requiredLevel: 3
    }
]
