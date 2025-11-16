import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { downloadDataAsJSON } from '../utils/localStorage';
import { useGroup } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';

export default function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const group = useGroup();
  const { isAuthenticated, user } = useAuth();

  const handleExport = () => {
    downloadDataAsJSON();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/members', label: 'Members' },
    { path: '/events', label: 'Events' },
    { path: '/shirts', label: 'Shirts' },
    { path: '/statistics', label: 'Statistics' },
  ];

  return (
    <header className="bg-orange-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold">{group?.name || 'My Team'}</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {isAuthenticated && navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-700 text-white'
                      : 'text-orange-100 hover:bg-orange-500 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <button
                onClick={handleExport}
                className="px-3 py-2 rounded-md text-sm font-medium text-orange-100 hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-1"
                title="Export data"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export
              </button>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-orange-100">
                  {user?.firstName} {user?.lastName}
                </span>
                <LogoutButton />
              </div>
            ) : (
              <LoginButton />
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="bg-orange-700 inline-flex items-center justify-center p-2 rounded-md text-orange-200 hover:text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Menu icon */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {isAuthenticated && navItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-700 text-white'
                        : 'text-orange-100 hover:bg-orange-500 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleExport();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-orange-100 hover:bg-orange-500 hover:text-white transition-colors"
                >
                  Export
                </button>
              )}
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-base text-orange-100">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="px-3 py-2">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <div className="px-3 py-2">
                  <LoginButton />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}