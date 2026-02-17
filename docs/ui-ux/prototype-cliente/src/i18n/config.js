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
import notesES from '../locales/es/notes.json';
import contactsES from '../locales/es/contacts.json';
import bookmarksES from '../locales/es/bookmarks.json';
import envVarsES from '../locales/es/envVars.json';
import sshKeysES from '../locales/es/sshKeys.json';
import sslCertsES from '../locales/es/sslCerts.json';
import snippetsES from '../locales/es/snippets.json';
import formsES from '../locales/es/forms.json';
import auditLogES from '../locales/es/auditLog.json';
import reportsES from '../locales/es/reports.json';

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
import notesEN from '../locales/en/notes.json';
import contactsEN from '../locales/en/contacts.json';
import bookmarksEN from '../locales/en/bookmarks.json';
import envVarsEN from '../locales/en/envVars.json';
import sshKeysEN from '../locales/en/sshKeys.json';
import sslCertsEN from '../locales/en/sslCerts.json';
import snippetsEN from '../locales/en/snippets.json';
import formsEN from '../locales/en/forms.json';
import auditLogEN from '../locales/en/auditLog.json';
import reportsEN from '../locales/en/reports.json';

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
        notes: notesES,
        contacts: contactsES,
        bookmarks: bookmarksES,
        envVars: envVarsES,
        sshKeys: sshKeysES,
        sslCerts: sslCertsES,
        snippets: snippetsES,
        forms: formsES,
        auditLog: auditLogES,
        reports: reportsES,
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
        notes: notesEN,
        contacts: contactsEN,
        bookmarks: bookmarksEN,
        envVars: envVarsEN,
        sshKeys: sshKeysEN,
        sslCerts: sslCertsEN,
        snippets: snippetsEN,
        forms: formsEN,
        auditLog: auditLogEN,
        reports: reportsEN,
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
