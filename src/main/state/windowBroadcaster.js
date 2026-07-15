const createWindowBroadcaster = ({ windowRegistry }) => {
  const sendToWindow = (name, channel, payload) => {
    const win = windowRegistry.getWindow(name)

    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload)
    }
  }

  const sendToWindows = (names, channel, payload) => {
    for (const name of names) {
      sendToWindow(name, channel, payload)
    }
  }

  const sendToAllWindows = (channel, payload) => {
    for (const win of windowRegistry.getAllWindows()) {
      if (win && !win.isDestroyed()) {
        win.webContents.send(channel, payload)
      }
    }
  }

  return {
    sendToWindow,
    sendToWindows,
    sendToAllWindows
  }
}

module.exports = {
  createWindowBroadcaster
}
