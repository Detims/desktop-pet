import { PET_STATS } from './PetStats'

export function PetStatsOverlay() {
  return (
    <div className="pet-stats-menu">
      <div className="pet-stats-title">Pet Stats</div>

      {PET_STATS.map((stat) => {
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