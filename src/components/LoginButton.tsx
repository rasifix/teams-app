import { Link } from 'react-router-dom';

export default function LoginButton() {
  return (
    <Link
      to="/login"
      className="px-4 py-2 rounded-md text-sm font-medium bg-orange-700 text-white hover:bg-orange-800 transition-colors"
    >
      Login
    </Link>
  );
}
