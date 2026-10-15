import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquad, useTrainers } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { selectHeaderNavItems } from '../store/selectors/navigationSelectors';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import { SUPPORTED_LANGUAGES } from '../i18n/config';

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101b24]/95 text-white shadow-[0_8px_30px_-22px_rgba(0,0,0,.8)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between">
          {/* Logo/Title */}
          <Link to="/" className="group flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-orange-500 shadow-lg shadow-orange-950/30 transition group-hover:rotate-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8.5 12 5l7 3.5v7L12 19l-7-3.5v-7Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 10.25 3.5 1.8 3.5-1.8M12 12v4" />
              </svg>
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">{isAuthenticated ? (squad?.name || t('app.name')) : t('app.name')}</h1>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block">{t('app.tagline')}</p>
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
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <div className="ml-2 flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1" aria-label={t('common.language')}>
              {SUPPORTED_LANGUAGES.map((language) => {
                const isActive = activeLanguage === language;
                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => handleLanguageChange(language)}
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    aria-pressed={isActive}
                  >
                    {language.toUpperCase()}
                  </button>
                );
              })}
            </div>
            {isAuthenticated ? (
              <div className="ml-2 flex items-center gap-3 border-l border-white/10 pl-3">
                <span className="max-w-32 truncate text-sm text-slate-300">
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
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400"
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
          <div className="border-t border-white/10 py-3 md:hidden" id="mobile-menu">
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
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <div className="px-3 py-2">
                <div className="mb-2 text-xs text-slate-400">{t('common.language')}</div>
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
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
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
                  <div className="px-3 py-2 text-base text-slate-300">
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
