const getXpRequiredForLevel = (level) => {
  return Math.floor(100 + (level - 1) * 50 + Math.pow(level - 1, 2) * 10)
}

const normalizeProgression = (save) => {
  const level = Number.isFinite(save.level) ? save.level : 1
  const xp = Number.isFinite(save.xp) ? save.xp : 0

  return {
    ...save,
    level,
    xp,
    xpToNextLevel: getXpRequiredForLevel(level),
    totalXpEarned: Number.isFinite(save.totalXpEarned)
      ? save.totalXpEarned
      : 0
  }
}

const applyXPGain = (save, amount) => {
  let nextSave = normalizeProgression(save)

  const xpGain = Math.max(0, Math.floor(amount))

  if (xpGain <= 0) {
    return {
      save: nextSave,
      leveledUp: false,
      levelsGained: 0,
      xpGained: 0
    }
  }

  let level = nextSave.level
  let xp = nextSave.xp + xpGain
  let levelsGained = 0

  while (xp >= getXpRequiredForLevel(level)) {
    xp -= getXpRequiredForLevel(level)
    level += 1
    levelsGained += 1
  }

  nextSave = {
    ...nextSave,
    level,
    xp,
    xpToNextLevel: getXpRequiredForLevel(level),
    totalXpEarned: nextSave.totalXpEarned + xpGain
  }

  return {
    save: nextSave,
    leveledUp: levelsGained > 0,
    levelsGained,
    xpGained: xpGain
  }
}

module.exports = {
  getXpRequiredForLevel,
  normalizeProgression,
  applyXPGain
}