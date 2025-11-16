import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-md text-sm font-medium bg-orange-700 text-white hover:bg-orange-800 transition-colors"
    >
      Logout
    </button>
  );
}
