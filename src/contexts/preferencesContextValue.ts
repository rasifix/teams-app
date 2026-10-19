import { createContext } from 'react';
import type { SupportedLanguage } from '../i18n/config';

export type LanguagePreference = 'system' | SupportedLanguage;
export type ThemePreference = 'system' | 'light' | 'dark';
export type DensityPreference = 'default' | 'compact';

export interface PreferencesContextValue {
  language: LanguagePreference;
  theme: ThemePreference;
  density: DensityPreference;
  setLanguage: (preference: LanguagePreference) => void;
  setTheme: (preference: ThemePreference) => void;
  setDensity: (preference: DensityPreference) => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
