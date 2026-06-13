export {}


declare global {
  interface Window {
    desktopPet: {
      showPetMenu: () => void

      onPetStateChanged: (
        callback: (state: string) => void
      ) => () => void

      getWindowPosition: () => Promise<{ x: number; y: number }>

      setWindowPosition: (position: { x: number, y: number }) => void
      
      startCrawling: () => void

      stopCrawling: () => void

      onCrawlingStopped: () => void

      onContextMenuClosed: (callback: () => void) => () => void 

      onPetTalk: (callback: () => void) => () => void

      showStatsMenu: (position: { x: number, y: number }) => void
      
      moveStatsMenu: (position: WindowPosition ) => void

      hideStatsMenu: () => void

      closeShopWindow: () => void
    }
  }
}