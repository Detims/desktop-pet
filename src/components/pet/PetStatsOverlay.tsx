import { useEffect, useMemo, useState } from 'react'
import { PET_STATS } from './PetStats'

export function PetStatsOverlay() {
  const [currency, setCurrency] = useState(0)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    window.desktopPet.getPetSave().then((save) => {
      setCurrency(save.currency)
      setLevel(save.level)
    })

    return window.desktopPet.onPetSaveUpdated((save) => {
      setCurrency(save.currency)
      setLevel(save.level)
    })
  }, [])

  const stats = useMemo(() => {
    return PET_STATS.map((stat) => {
      if (stat.label === 'Currency') {
        return {
          ...stat,
          value: currency
        }
      }

      if (stat.label === 'Level') {
        return {
          ...stat,
          value: level
        }
      }

      return stat
    })
  }, [currency, level])

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