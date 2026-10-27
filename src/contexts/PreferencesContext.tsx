import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import i18n, { detectSystemLanguage, LANGUAGE_STORAGE_KEY } from '../i18n/config';
import { PreferencesContext, type DensityPreference, type FontPreference, type LanguagePreference, type ThemePreference } from './preferencesContextValue';

const THEME_STORAGE_KEY = 'my-teams-theme';
const DENSITY_STORAGE_KEY = 'my-teams-density';
const FONT_STORAGE_KEY = 'my-teams-font';

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
  const [font, setFont] = useState<FontPreference>(() =>
    readPreference(FONT_STORAGE_KEY, ['inter', 'jakarta', 'barlow-condensed', 'roboto-condensed', 'oswald'], 'inter')
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
    if (font === 'inter') {
      window.localStorage.removeItem(FONT_STORAGE_KEY);
      delete document.documentElement.dataset.font;
    } else {
      window.localStorage.setItem(FONT_STORAGE_KEY, font);
      document.documentElement.dataset.font = font;
    }
  }, [theme, density, font]);

  const value = useMemo(() => ({
    language,
    theme,
    density,
    font,
    setLanguage,
    setTheme,
    setDensity,
    setFont,
  }), [language, theme, density, font]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
