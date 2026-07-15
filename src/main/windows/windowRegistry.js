const createWindowRegistry = () => {
  const windows = {
    main: null,
    stats: null,
    shop: null,
    work: null,
    tasks: null
  }

  const getWindow = (name) => {
    return windows[name] ?? null
  }

  const setWindow = (name, win) => {
    windows[name] = win
  }

  const getWindows = (names) => {
    return names
      .map((name) => windows[name])
      .filter(Boolean)
  }

  const getAllWindows = () => {
    return Object.values(windows).filter(Boolean)
  }

  return {
    getWindow,
    setWindow,
    getWindows,
    getAllWindows
  }
}

module.exports = {
  createWindowRegistry
}
