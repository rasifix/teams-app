import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquad, useTrainers } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { selectHeaderNavItems } from '../store/selectors/navigationSelectors';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import { IconButton } from './ui';
import UserPreferencesMenu from './UserPreferencesMenu';

export default function Header() {
  const { t } = useTranslation();
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

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('preferences.account');

  return (
    <header className="app-header">
      <div className="app-header-container">
        <div className="app-header-bar">
          {/* Logo/Title */}
          <Link to="/" className="app-brand">
            <span className="app-brand-mark">
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8.5 12 5l7 3.5v7L12 19l-7-3.5v-7Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 10.25 3.5 1.8 3.5-1.8M12 12v4" />
              </svg>
            </span>
            <div>
              <span className="app-brand-title">{isAuthenticated ? (squad?.name || t('app.name')) : t('app.name')}</span>
              <p className="app-brand-tagline">{t('app.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="app-desktop-nav">
            {isAuthenticated && navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`app-nav-link${isActive ? ' app-nav-link--active' : ''}`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <div className="app-account">
                <UserPreferencesMenu userName={userName} />
                <LogoutButton />
              </div>
            ) : (
              <LoginButton />
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="app-mobile-trigger">
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
          <div className="app-mobile-menu" id="mobile-menu">
            <div className="app-mobile-menu-content">
              {isAuthenticated && navItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`app-mobile-nav-link${isActive ? ' app-mobile-nav-link--active' : ''}`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <>
                  <div className="app-mobile-section">
                    <UserPreferencesMenu userName={userName} mobile />
                  </div>
                  <div className="app-mobile-section">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <div className="app-mobile-section">
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
