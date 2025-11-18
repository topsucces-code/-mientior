import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Support for Next.js basePath
const basePath = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_BASE_PATH || '') 
  : '';

// Initialize i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'admin'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: `${basePath}/locales/{{lng}}/{{ns}}.json`,
      addPath: undefined,
    },
    react: {
      useSuspense: false,
    },
  });

// Refine i18n provider
export const refineI18nProvider = {
  translate: (key: string, options?: Record<string, unknown>) => {
    return i18n.t(key, options);
  },
  changeLocale: (lang: string) => {
    return i18n.changeLanguage(lang);
  },
  getLocale: () => {
    return i18n.language;
  },
};

export default i18n;
