const { screen } = require('electron/main')

const ensureWindowBoundsAreVisible = (bounds) => {
  if (bounds.x === undefined || bounds.y === undefined) {
    return bounds
  }

  const matchingDisplay = screen.getAllDisplays().find((display) => {
    const area = display.workArea

    return (
      bounds.x >= area.x &&
      bounds.y >= area.y &&
      bounds.x < area.x + area.width &&
      bounds.y < area.y + area.height
    )
  })

  if (matchingDisplay) {
    return bounds
  }

  return {
    ...bounds,
    x: undefined,
    y: undefined
  }
}

module.exports = {
  ensureWindowBoundsAreVisible
}