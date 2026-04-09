import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'my-teams-language';
const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const normalizeLanguage = (value: string | null | undefined): SupportedLanguage | null => {
  if (!value) return null;

  const lower = value.toLowerCase();
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('en')) return 'en';

  return null;
};

const detectInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';

  const storedLanguage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  if (storedLanguage) return storedLanguage;

  const browserLanguage = normalizeLanguage(window.navigator.language);
  return browserLanguage ?? 'en';
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
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = normalizeLanguage(language) ?? 'en';
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES };
export default i18n;