import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import i18n, { detectSystemLanguage, LANGUAGE_STORAGE_KEY } from '../i18n/config';
import { PreferencesContext, type DensityPreference, type LanguagePreference, type ThemePreference } from './preferencesContextValue';

const THEME_STORAGE_KEY = 'my-teams-theme';
const DENSITY_STORAGE_KEY = 'my-teams-density';

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  return stored && allowed.includes(stored as T) ? stored as T : fallback;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguagePreference>(() =>
    readPreference(LANGUAGE_STORAGE_KEY, ['en', 'de'], 'system')
  );
  const [theme, setTheme] = useState<ThemePreference>(() =>
    readPreference(THEME_STORAGE_KEY, ['light', 'dark'], 'system')
  );
  const [density, setDensity] = useState<DensityPreference>(() =>
    readPreference(DENSITY_STORAGE_KEY, ['default', 'compact'], 'default')
  );

  useEffect(() => {
    const applyLanguage = () => {
      const resolvedLanguage = language === 'system' ? detectSystemLanguage() : language;
      if (i18n.resolvedLanguage !== resolvedLanguage) void i18n.changeLanguage(resolvedLanguage);
    };

    if (language === 'system') window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    else window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyLanguage();
    window.addEventListener('languagechange', applyLanguage);
    return () => window.removeEventListener('languagechange', applyLanguage);
  }, [language]);

  useLayoutEffect(() => {
    if (theme === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      delete document.documentElement.dataset.theme;
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      document.documentElement.dataset.theme = theme;
    }

    if (density === 'default') {
      window.localStorage.removeItem(DENSITY_STORAGE_KEY);
      delete document.documentElement.dataset.density;
    } else {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
      document.documentElement.dataset.density = density;
    }
  }, [theme, density]);

  const value = useMemo(() => ({
    language,
    theme,
    density,
    setLanguage,
    setTheme,
    setDensity,
  }), [language, theme, density]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
