export {}


declare global {
  interface Window {
    desktopPet: {
      showPetMenu: () => void

      onPetStateChanged: (
        callback: (state: string) => void
      ) => () => void

      getWindowPosition: () => Promise<{ x: number; y: number }>

      setWindowPosition: (position: {
        x: number
        y: number
      }) => void
    }
  }
}