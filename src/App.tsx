import { DesktopPet } from "./components/pet/DesktopPet";
import { PetStatsOverlay } from "./components/pet/PetStatsOverlay";
import { PetShop } from "./components/pet/PetShop";

export default function App() {
  if (window.location.hash === '#/stats') 
    return <PetStatsOverlay />

  if (window.location.hash === '#/shop')
    return <PetShop />

  return <DesktopPet />;
}