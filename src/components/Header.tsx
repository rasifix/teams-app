import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquad, useTrainers } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { selectHeaderNavItems } from '../store/selectors/navigationSelectors';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import { SUPPORTED_LANGUAGES } from '../i18n/config';
import { Button, IconButton } from './ui';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const squad = useSquad();
  const trainers = useTrainers();
  const { isAuthenticated, user } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = useMemo(
    () => selectHeaderNavItems(user, squad, trainers),
    [user, squad, trainers],
  );

  const activeLanguage = i18n.language.startsWith('de') ? 'de' : 'en';

  const handleLanguageChange = (language: 'en' | 'de') => {
    void i18n.changeLanguage(language);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-edge-inverse bg-header/95 text-content-inverse shadow-lg backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between">
          {/* Logo/Title */}
          <Link to="/" className="group flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand shadow-lg  transition group-hover:rotate-3">
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8.5 12 5l7 3.5v7L12 19l-7-3.5v-7Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 10.25 3.5 1.8 3.5-1.8M12 12v4" />
              </svg>
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">{isAuthenticated ? (squad?.name || t('app.name')) : t('app.name')}</h1>
              <p className="hidden text-micro font-semibold uppercase tracking-label text-content-disabled sm:block">{t('app.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {isAuthenticated && navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface text-content-strong shadow-sm'
                      : 'text-content-disabled hover:bg-inverse-overlay/10 hover:text-content-inverse'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <div className="ml-2 flex items-center gap-1 rounded-full border border-edge-inverse bg-inverse-overlay/5 p-1" aria-label={t('common.language')}>
              {SUPPORTED_LANGUAGES.map((language) => {
                const isActive = activeLanguage === language;
                return (
                  <Button
                    key={language}
                    type="button"
                    variant={isActive ? 'primary' : 'inverse'}
                    size="sm"
                    onClick={() => handleLanguageChange(language)}
                    className="min-w-8 px-2 text-eyebrow"
                    aria-pressed={isActive}
                  >
                    {language.toUpperCase()}
                  </Button>
                );
              })}
            </div>
            {isAuthenticated ? (
              <div className="ml-2 flex items-center gap-3 border-l border-edge-inverse pl-3">
                <span className="max-w-32 truncate text-sm text-content-disabled">
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
            <IconButton
              variant="inverse"
              label={t('common.openMainMenu')}
              onClick={toggleMobileMenu}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              {/* Menu icon */}
              <svg
                className="icon-md"
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
            </IconButton>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-edge-inverse py-3 md:hidden" id="mobile-menu">
            <div className="space-y-1 px-1 pb-2 pt-1">
              {isAuthenticated && navItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                      ? 'bg-surface text-content-strong'
                      : 'text-content-disabled hover:bg-inverse-overlay/10 hover:text-content-inverse'
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <div className="px-3 py-2">
                <div className="mb-2 text-xs text-content-disabled">{t('common.language')}</div>
                <div className="layout-cluster">
                  {SUPPORTED_LANGUAGES.map((language) => {
                    const isActive = activeLanguage === language;
                    return (
                      <Button
                        key={language}
                        type="button"
                        variant={isActive ? 'primary' : 'inverse'}
                        size="sm"
                        onClick={() => handleLanguageChange(language)}
                        className="px-2 text-xs"
                        aria-pressed={isActive}
                      >
                        {language.toUpperCase()}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-base text-content-disabled">
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
