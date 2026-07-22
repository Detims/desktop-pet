const clampStat = (value) => {
  return Math.max(0, Math.min(100, Math.round(value)))
}

const normalizeStats = (stats = {}) => {
  return {
    health: clampStat(stats.health ?? 100),
    hunger: clampStat(stats.hunger ?? 100),
    thirst: clampStat(stats.thirst ?? 100),
    energy: clampStat(stats.energy ?? 100),
    mood: clampStat(stats.mood ?? 100),
    lastUpdatedAt: Number.isFinite(stats.lastUpdatedAt)
      ? stats.lastUpdatedAt
      : Date.now()
  }
}

const applyStatEffects = (stats, effects = {}) => {
  const currentStats = normalizeStats(stats)

  return {
    ...currentStats,
    health: clampStat(currentStats.health + (effects.health ?? 0)),
    hunger: clampStat(currentStats.hunger + (effects.hunger ?? 0)),
    thirst: clampStat(currentStats.thirst + (effects.thirst ?? 0)),
    energy: clampStat(currentStats.energy + (effects.energy ?? 0)),
    mood: clampStat(currentStats.mood + (effects.mood ?? 0)),
    lastUpdatedAt: Date.now()
  }
}

const calculatePassiveStatDecay = (stats, now = Date.now()) => {
  const currentStats = normalizeStats(stats)
  const elapsedMs = Math.max(0, now - currentStats.lastUpdatedAt)
  const elapsedMinutes = elapsedMs / 60_000

  if (elapsedMinutes < 1) {
    return currentStats
  }

  const hungerLoss = elapsedMinutes * 0.2
  const thirstLoss = elapsedMinutes * 0.35
  const energyLoss = elapsedMinutes * 0.15

  let nextStats = {
    ...currentStats,
    hunger: clampStat(currentStats.hunger - hungerLoss),
    thirst: clampStat(currentStats.thirst - thirstLoss),
    energy: clampStat(currentStats.energy - energyLoss)
  }

  const hungerPenalty = nextStats.hunger < 25 ? 0.15 * elapsedMinutes : 0
  const thirstPenalty = nextStats.thirst < 25 ? 0.25 * elapsedMinutes : 0
  const energyPenalty = nextStats.energy < 20 ? 0.15 * elapsedMinutes : 0

  nextStats = {
    ...nextStats,
    mood: clampStat(
      nextStats.mood -
        hungerPenalty -
        thirstPenalty -
        energyPenalty
    )
  }

  const healthPenalty =
    nextStats.hunger <= 0 || nextStats.thirst <= 0
      ? 0.3 * elapsedMinutes
      : 0

  nextStats = {
    ...nextStats,
    health: clampStat(nextStats.health - healthPenalty),
    lastUpdatedAt: now
  }

  return nextStats
}

module.exports = {
  clampStat,
  normalizeStats,
  applyStatEffects,
  calculatePassiveStatDecay
}