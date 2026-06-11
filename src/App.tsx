import { DesktopPet } from "./components/pet/DesktopPet";
import { PetStatsOverlay } from "./components/pet/PetStatsOverlay";

export default function App() {
  if (window.location.hash === '#/stats') 
    return <PetStatsOverlay />
  return <DesktopPet />;
}