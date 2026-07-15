const { screen } = require('electron/main')

const IDLE_BEFORE_CRAWL_MS = 5_000

const createCrawlingController = ({
  getMainWindow,
  getActiveWork
}) => {
  let crawlTimer = null
  let crawlDecisionTimer = null
  let crawlIdleTimer = null
  let crawlPosition = null
  let isCrawling = false
  let crawlStoppedByUser = false
  let crawlVelocity = { x: 1, y: 0 }

  const chooseRandomCrawlDirection = () => {
    const speed = 1.2

    crawlVelocity = {
      x: Math.random() > 0.5 ? speed : -speed,
      y: 0
    }
  }

  const scheduleCrawlAfterIdle = () => {
    if (getActiveWork()) return

    if (crawlIdleTimer) {
      clearTimeout(crawlIdleTimer)
      crawlIdleTimer = null
    }

    crawlIdleTimer = setTimeout(() => {
      crawlIdleTimer = null

      const mainWindow = getMainWindow()

      if (!crawlStoppedByUser && mainWindow && !mainWindow.isDestroyed()) {
        startPetCrawling(mainWindow)
      }
    }, IDLE_BEFORE_CRAWL_MS)
  }

  const startPetCrawling = (win) => {
    if (getActiveWork()) return
    if (!win || win.isDestroyed()) return
    if (isCrawling) return

    if (crawlIdleTimer) {
      clearTimeout(crawlIdleTimer)
      crawlIdleTimer = null
    }

    if (crawlTimer) {
      clearInterval(crawlTimer)
      crawlTimer = null
    }

    if (crawlDecisionTimer) {
      clearInterval(crawlDecisionTimer)
      crawlDecisionTimer = null
    }

    crawlStoppedByUser = false
    isCrawling = true

    const [startX, startY] = win.getPosition()
    crawlPosition = { x: startX, y: startY }

    chooseRandomCrawlDirection()

    crawlTimer = setInterval(() => {
      if (!win || win.isDestroyed() || !crawlPosition) return

      const [width, height] = win.getSize()

      const display = screen.getDisplayNearestPoint({
        x: crawlPosition.x,
        y: crawlPosition.y
      })

      const bounds = display.workArea

      crawlPosition.x += crawlVelocity.x
      crawlPosition.y += crawlVelocity.y

      if (crawlPosition.x <= bounds.x) {
        crawlPosition.x = bounds.x
        crawlVelocity.x = Math.abs(crawlVelocity.x)
      }

      if (crawlPosition.x + width >= bounds.x + bounds.width) {
        crawlPosition.x = bounds.x + bounds.width - width
        crawlVelocity.x = -Math.abs(crawlVelocity.x)
      }

      if (crawlPosition.y <= bounds.y) {
        crawlPosition.y = bounds.y
        crawlVelocity.y = Math.abs(crawlVelocity.y)
      }

      if (crawlPosition.y + height >= bounds.y + bounds.height) {
        crawlPosition.y = bounds.y + bounds.height - height
        crawlVelocity.y = -Math.abs(crawlVelocity.y)
      }

      win.setPosition(
        Math.round(crawlPosition.x),
        Math.round(crawlPosition.y)
      )
    }, 16)

    crawlDecisionTimer = setInterval(() => {
      if (!isCrawling) return

      const roll = Math.random()

      if (roll < 0.1) {
        stopPetCrawling({
          byUser: false,
          scheduleRestart: true
        })
        return
      }

      if (roll < 0.2) {
        chooseRandomCrawlDirection()
      }
    }, 1000)
  }

  const stopPetCrawling = ({
    byUser = false,
    scheduleRestart = true
  } = {}) => {
    isCrawling = false
    crawlStoppedByUser = byUser

    if (crawlTimer) {
      clearInterval(crawlTimer)
      crawlTimer = null
    }

    if (crawlDecisionTimer) {
      clearInterval(crawlDecisionTimer)
      crawlDecisionTimer = null
    }

    if (crawlIdleTimer) {
      clearTimeout(crawlIdleTimer)
      crawlIdleTimer = null
    }

    if (scheduleRestart && !byUser) {
      scheduleCrawlAfterIdle()
    }
  }

  const setCrawlPosition = (position) => {
    crawlPosition = position
  }

  const destroy = () => {
    stopPetCrawling({
      byUser: true,
      scheduleRestart: false
    })
  }

  return {
    startPetCrawling,
    stopPetCrawling,
    scheduleCrawlAfterIdle,
    setCrawlPosition,
    destroy
  }
}

module.exports = {
  createCrawlingController
}