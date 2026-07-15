import { useEffect, useMemo, useState } from 'react'
import { PET_STATS } from './PetStats'
import { PetSave } from '../../types/pet'

export function PetStatsOverlay() {
  const [save, setSave] = useState<PetSave | null>(null)

  useEffect(() => {
    window.desktopPet.getPetSave().then(setSave)

    return window.desktopPet.onPetSaveUpdated((nextSave) => {
      setSave(nextSave)
    })
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

      return stat
    })
  }, [save])

  return (
    <div className="pet-stats-menu">
      <div className="pet-stats-title">Pet Stats</div>

      {stats.map((stat) => {
        const percent = Math.max(0, Math.min(100, (stat.value / stat.max) * 100))

        return (
          <div key={stat.label} className="pet-stat-row">
            <div className="pet-stat-label">
              <span>{stat.label}</span>
              <span>
                {stat.value}/{stat.max}
              </span>
            </div>

            <div className="pet-stat-bar">
              <div
                className="pet-stat-bar-fill"
                style={{ width: `${percent}%` }}
              />
              <div className="pet-stat-bar-text">
                {stat.value}/{stat.max}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}