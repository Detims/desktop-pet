import { DesktopPet } from "./components/pet/DesktopPet";
import { PetStatsOverlay } from "./components/pet/PetStatsOverlay";
import { PetShop } from "./components/pet/PetShop";
import { PetWork } from "./components/pet/PetWork";
import { PetTasks } from "./components/pet/PetTasks";

export default function App() {
  if (window.location.hash === '#/stats') 
    return <PetStatsOverlay />

  if (window.location.hash === '#/shop')
    return <PetShop />

  if (window.location.hash === '#/work')
    return <PetWork />

  if (window.location.hash === '#/tasks')
    return <PetTasks />

  return <DesktopPet />;
}