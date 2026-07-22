import { useEffect, useMemo, useState } from 'react'
import { PET_STATS } from './PetStats'
import type { PetSave } from '../../types/pet'

export function PetStatsOverlay() {
  const [save, setSave] = useState<PetSave | null>(null)

  useEffect(() => {
    let isMounted = true

    window.desktopPet.getPetSave().then((nextSave) => {
      if (isMounted) {
        setSave(nextSave)
      }
    })

    const unsubscribe = window.desktopPet.onPetSaveUpdated((nextSave) => {
      setSave(nextSave)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const stats = useMemo(() => {
    if (!save) return PET_STATS

    return PET_STATS.map((stat) => {
      if (stat.label === 'Level') {
        return {
          ...stat,
          value: save.level,
          max: Math.max(save.level, 1)
        }
      }

      if (stat.label === 'XP') {
        return {
          ...stat,
          value: save.xp,
          max: save.xpToNextLevel
        }
      }

      if (stat.label === 'Currency') {
        return {
          ...stat,
          value: save.currency,
          max: 9999
        }
      }

      if (stat.label === 'Health') {
        return {
          ...stat,
          value: save.stats.health,
          max: 100
        }
      }

      if (stat.label === 'Hunger') {
        return {
          ...stat,
          value: save.stats.hunger,
          max: 100
        }
      }

      if (stat.label === 'Thirst') {
        return {
          ...stat,
          value: save.stats.thirst,
          max: 100
        }
      }

      if (stat.label === 'Energy') {
        return {
          ...stat,
          value: save.stats.energy,
          max: 100
        }
      }

      if (stat.label === 'Mood') {
        return {
          ...stat,
          value: save.stats.mood,
          max: 100
        }
      }

      return stat
    })
  }, [save])

  return (
    <div className="pet-stats-menu">
      <div className="pet-stats-title">Pet Stats</div>

      {stats.map((stat) => {
        const percent =
          stat.max > 0
            ? Math.max(0, Math.min(100, (stat.value / stat.max) * 100))
            : 0

        return (
          <div key={stat.label} className="pet-stat-row">
            <div className="pet-stat-label">
              <span>{stat.label}</span>
              <span>
                {stat.label === 'Level'
                  ? stat.value
                  : `${stat.value}/${stat.max}`}
              </span>
            </div>

            {stat.label !== 'Level' && (
              <div className="pet-stat-bar">
                <div
                  className="pet-stat-bar-fill"
                  style={{ width: `${percent}%` }}
                />
                <div className="pet-stat-bar-text">
                  {stat.label === 'Currency'
                    ? stat.value
                    : `${stat.value}/${stat.max}`}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}