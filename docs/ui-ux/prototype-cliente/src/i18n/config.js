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
import tasksES from '../locales/es/tasks.json';
import calendarES from '../locales/es/calendar.json';
import projectsES from '../locales/es/projects.json';
import landingES from '../locales/es/landing.json';
import notificationsES from '../locales/es/notifications.json';
import settingsES from '../locales/es/settings.json';

// Import English translations
import commonEN from '../locales/en/common.json';
import navbarEN from '../locales/en/navbar.json';
import sidebarEN from '../locales/en/sidebar.json';
import dashboardEN from '../locales/en/dashboard.json';
import validationEN from '../locales/en/validation.json';
import featuresEN from '../locales/en/features.json';
import tasksEN from '../locales/en/tasks.json';
import calendarEN from '../locales/en/calendar.json';
import projectsEN from '../locales/en/projects.json';
import landingEN from '../locales/en/landing.json';
import notificationsEN from '../locales/en/notifications.json';
import settingsEN from '../locales/en/settings.json';

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
        tasks: tasksES,
        calendar: calendarES,
        projects: projectsES,
        landing: landingES,
        notifications: notificationsES,
        settings: settingsES,
      },
      en: {
        common: commonEN,
        navbar: navbarEN,
        sidebar: sidebarEN,
        dashboard: dashboardEN,
        validation: validationEN,
        features: featuresEN,
        tasks: tasksEN,
        calendar: calendarEN,
        projects: projectsEN,
        landing: landingEN,
        notifications: notificationsEN,
        settings: settingsEN,
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
