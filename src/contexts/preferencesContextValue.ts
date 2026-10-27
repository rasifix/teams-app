import { createContext } from 'react';
import type { SupportedLanguage } from '../i18n/config';

export type LanguagePreference = 'system' | SupportedLanguage;
export type ThemePreference = 'system' | 'light' | 'dark';
export type DensityPreference = 'default' | 'compact';
export type FontPreference = 'inter' | 'jakarta' | 'barlow-condensed' | 'roboto-condensed' | 'oswald';

export interface PreferencesContextValue {
  language: LanguagePreference;
  theme: ThemePreference;
  density: DensityPreference;
  font: FontPreference;
  setLanguage: (preference: LanguagePreference) => void;
  setTheme: (preference: ThemePreference) => void;
  setDensity: (preference: DensityPreference) => void;
  setFont: (preference: FontPreference) => void;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
