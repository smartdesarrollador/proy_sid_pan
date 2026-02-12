import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Spanish translations
import commonES from '../locales/es/common.json';
import navbarES from '../locales/es/navbar.json';
import sidebarES from '../locales/es/sidebar.json';
import dashboardES from '../locales/es/dashboard.json';
import validationES from '../locales/es/validation.json';
import featuresES from '../locales/es/features.json';
import usersES from '../locales/es/users.json';
import rolesES from '../locales/es/roles.json';
import clientsES from '../locales/es/clients.json';

// Import English translations
import commonEN from '../locales/en/common.json';
import navbarEN from '../locales/en/navbar.json';
import sidebarEN from '../locales/en/sidebar.json';
import dashboardEN from '../locales/en/dashboard.json';
import validationEN from '../locales/en/validation.json';
import featuresEN from '../locales/en/features.json';
import usersEN from '../locales/en/users.json';
import rolesEN from '../locales/en/roles.json';
import clientsEN from '../locales/en/clients.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: commonES,
        navbar: navbarES,
        sidebar: sidebarES,
        dashboard: dashboardES,
        validation: validationES,
        features: featuresES,
        users: usersES,
        roles: rolesES,
        clients: clientsES,
      },
      en: {
        common: commonEN,
        navbar: navbarEN,
        sidebar: sidebarEN,
        dashboard: dashboardEN,
        validation: validationEN,
        features: featuresEN,
        users: usersEN,
        roles: rolesEN,
        clients: clientsEN,
      }
    },
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage'
    }
  });

export default i18n;
