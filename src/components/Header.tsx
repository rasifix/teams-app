import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroup } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import { SUPPORTED_LANGUAGES } from '../i18n/config';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const group = useGroup();
  const { isAuthenticated, user } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/members', labelKey: 'nav.members' },
    { path: '/events', labelKey: 'nav.events' },
    { path: '/shirts', labelKey: 'nav.shirts' },
    { path: '/statistics', labelKey: 'nav.statistics' },
  ];

  const activeLanguage = i18n.language.startsWith('de') ? 'de' : 'en';

  const handleLanguageChange = (language: 'en' | 'de') => {
    void i18n.changeLanguage(language);
  };

  return (
    <header className="relative bg-gradient-to-b from-orange-600/70 to-orange-600 backdrop-blur-md text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold">{isAuthenticated ? (group?.name || t('app.name')) : t('app.name')}</h1>
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
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <div className="flex items-center gap-2" aria-label={t('common.language')}>
              {SUPPORTED_LANGUAGES.map((language) => {
                const isActive = activeLanguage === language;
                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => handleLanguageChange(language)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-white text-orange-700'
                        : 'bg-orange-700 text-orange-100 hover:bg-orange-800 hover:text-white'
                    }`}
                    aria-pressed={isActive}
                  >
                    {language.toUpperCase()}
                  </button>
                );
              })}
            </div>
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
              <span className="sr-only">{t('common.openMainMenu')}</span>
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
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <div className="px-3 py-2">
                <div className="text-xs text-orange-100 mb-2">{t('common.language')}</div>
                <div className="flex items-center gap-2">
                  {SUPPORTED_LANGUAGES.map((language) => {
                    const isActive = activeLanguage === language;
                    return (
                      <button
                        key={language}
                        type="button"
                        onClick={() => handleLanguageChange(language)}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-white text-orange-700'
                            : 'bg-orange-700 text-orange-100 hover:bg-orange-800 hover:text-white'
                        }`}
                        aria-pressed={isActive}
                      >
                        {language.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
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