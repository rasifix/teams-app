import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'my-teams-language-preference';
const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const normalizeLanguage = (value: string | null | undefined): SupportedLanguage | null => {
  if (!value) return null;

  const lower = value.toLowerCase();
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('en')) return 'en';

  return null;
};

export const detectSystemLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  const browserLanguage = normalizeLanguage(window.navigator.language);
  return browserLanguage ?? 'en';
};

const detectInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)) ?? detectSystemLanguage();
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    document.documentElement.lang = normalizeLanguage(language) ?? 'en';
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES };
export default i18n;
