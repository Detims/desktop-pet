import type {
  ActivePetWork,
  AddTaskInput,
  PetSave,
  PetTask,
  PetWorkOption,
  PurchaseResult,
  TaskResult,
  WindowPosition
} from './pet'

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

      onContextMenuClosed: (callback: () => void) => () => void 

      onPetTalk: (callback: () => void) => () => void

      showStatsMenu: (position: { x: number, y: number }) => void
      
      moveStatsMenu: (position: WindowPosition ) => void

      hideStatsMenu: () => void

      closeShopWindow: () => void

      startWork: (workOption: PetWorkOption) => void

      cancelWork: () => void

      getActiveWork: () => Promise<ActivePetWork>

      onWorkUpdated: (callback: (activeWork: ActivePetWork) => void) => () => void

      onWorkCompleted: (callback: (completedWork: NonNullable<ActivePetWork>) => void) => () => void
      
      closeWorkWindow: () => void

      getPetSave: () => Promise<PetSave>

      purchaseItem: (
        item: {
          id: string
          price: number
        }
      ) => Promise<PurchaseResult>

      onPetSaveUpdated: (
        callback: (save: PetSave) => void
      ) => () => void

      getTasks: () => Promise<PetTask[]>

      addTask: (
        taskInput: AddTaskInput
      ) => Promise<TaskResult>

      updateTask: (
        task: PetTask
      ) => Promise<TaskResult>

      deleteTask: (
        taskId: string
      ) => Promise<TaskResult>

      onTasksUpdated: (
        callback: (tasks: PetTask[]) => void
      ) => () => void

      closeTasksWindow: () => void
    }
  }
}