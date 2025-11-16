import { Link } from 'react-router-dom';

export default function LoginButton() {
  return (
    <Link
      to="/login"
      className="px-4 py-2 rounded-md text-sm font-medium bg-orange-700 text-white hover:bg-orange-800 transition-colors flex items-center gap-2"
      title="Login"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
    </Link>
  );
}
