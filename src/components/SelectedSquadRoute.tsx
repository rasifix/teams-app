import { Navigate, Outlet } from 'react-router-dom';
import { useSquad } from '../store/useStore';

export default function SelectedSquadRoute() {
  const squad = useSquad();

  if (!squad) {
    return <Navigate to="/squads" replace />;
  }

  return <Outlet />;
}
