/**
 * Advanced i18next Configuration Example
 *
 * This file demonstrates a production-ready i18next setup with:
 * - TypeScript support
 * - Lazy loading
 * - Language detection
 * - Caching
 * - Error handling
 * - Performance optimization
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { format as formatDate, isDate } from 'date-fns'
import { enUS, es, fr, de } from 'date-fns/locale'

// ============== Configuration ==============

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de'] as const
export const DEFAULT_LANGUAGE = 'en' as const
export const DEFAULT_NAMESPACE = 'translation' as const
export const NAMESPACES = ['translation', 'auth', 'dashboard', 'products'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export type Namespace = (typeof NAMESPACES)[number]

// ============== Date Locales ==============

const dateLocales: Record<SupportedLanguage, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
}

// ============== i18next Initialization ==============

i18n
  // Load translations using HTTP backend (lazy loading)
  .use(HttpBackend)

  // Detect user language
  .use(LanguageDetector)

  // Pass i18n instance to react-i18next
  .use(initReactI18next)

  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: DEFAULT_LANGUAGE,

    // Supported languages
    supportedLngs: [...SUPPORTED_LANGUAGES],

    // Default namespace
    defaultNS: DEFAULT_NAMESPACE,

    // Available namespaces
    ns: [...NAMESPACES],

    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values

      // Custom format function
      format: (value, format, lng) => {
        // Format dates
        if (isDate(value) && format) {
          const locale = dateLocales[lng as SupportedLanguage] || enUS
          return formatDate(value, format, { locale })
        }

        // Format numbers
        if (typeof value === 'number' && format === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }

        // Format currency
        if (typeof value === 'number' && format?.startsWith('currency:')) {
          const currency = format.split(':')[1]
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency,
          }).format(value)
        }

        return value
      },
    },

    // React-specific options
    react: {
      // Use Suspense for lazy loading
      useSuspense: true,

      // Bind i18n instance to component tree
      bindI18n: 'languageChanged',
      bindI18nStore: '',

      // Re-render on language change
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },

    // Backend options (HTTP backend)
    backend: {
      // Path to translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',

      // Allow cross-domain requests
      crossDomain: false,

      // Request timeout
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default',
      },
    },

    // Language detection options
    detection: {
      // Detection order
      order: [
        'querystring',  // ?lng=en
        'cookie',       // Cookie: i18next
        'localStorage', // localStorage.getItem('i18nextLng')
        'navigator',    // Browser language
        'htmlTag',      // <html lang="en">
      ],

      // Keys to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,

      // Cache user language
      caches: ['localStorage', 'cookie'],

      // Exclude certain routes from language detection
      excludeCacheFor: ['cimode'],

      // Cookie options
      cookieMinutes: 525600, // 1 year
      cookieDomain: typeof window !== 'undefined' ? window.location.hostname : undefined,
    },

    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Missing translation key: "${key}" in namespace "${ns}" for languages: ${lngs.join(', ')}`
        )
      }

      // Send to analytics/error tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'missing_translation', {
          key,
          namespace: ns,
          languages: lngs,
        })
      }
    },

    // Return empty string for missing keys instead of key name
    returnEmptyString: false,

    // Parse missing key handler response
    parseMissingKeyHandler: (key) => {
      if (process.env.NODE_ENV === 'development') {
        return `[MISSING: ${key}]`
      }
      return key
    },

    // Append namespace to missing key
    appendNamespaceToCIMode: true,

    // Compatibility
    compatibilityJSON: 'v4',

    // Load options
    load: 'languageOnly', // en-US -> en

    // Preload languages
    preload: process.env.NODE_ENV === 'production' ? [DEFAULT_LANGUAGE] : SUPPORTED_LANGUAGES,

    // Non-explicit support
    nonExplicitSupportedLngs: false,

    // Clean code
    cleanCode: true,
  })

// ============== Custom Plugins ==============

/**
 * Cache translations in memory for performance
 */
const translationCache = new Map<string, any>()

i18n.on('loaded', (loaded) => {
  Object.entries(loaded).forEach(([lng, namespaces]) => {
    Object.entries(namespaces as Record<string, any>).forEach(([ns, translations]) => {
      const cacheKey = `${lng}:${ns}`
      translationCache.set(cacheKey, translations)
    })
  })
})

/**
 * Track language changes
 */
i18n.on('languageChanged', (lng) => {
  // Update HTML lang attribute
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }

  // Update cookie
  if (typeof document !== 'undefined') {
    document.cookie = `NEXT_LOCALE=${lng};path=/;max-age=31536000`
  }

  // Analytics event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'language_changed', { language: lng })
  }

  console.log(`Language changed to: ${lng}`)
})

/**
 * Handle initialization errors
 */
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error(`Failed to load namespace "${ns}" for language "${lng}": ${msg}`)

  // Send to error tracking
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(new Error(`i18n loading failed: ${msg}`), {
      extra: { language: lng, namespace: ns },
    })
  }
})

// ============== Helper Functions ==============

/**
 * Change language with error handling
 */
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  try {
    await i18n.changeLanguage(lng)
    console.log(`Successfully changed language to ${lng}`)
  } catch (error) {
    console.error(`Failed to change language to ${lng}:`, error)
    throw error
  }
}

/**
 * Get current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(lng: string): lng is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage)
}

/**
 * Preload namespace
 */
export async function preloadNamespace(ns: Namespace, lng?: SupportedLanguage): Promise<void> {
  const language = lng || getCurrentLanguage()
  await i18n.loadNamespaces(ns)
  console.log(`Preloaded namespace "${ns}" for language "${language}"`)
}

/**
 * Get translation without hook (for non-React code)
 */
export function translate(
  key: string,
  options?: Record<string, any>,
  lng?: SupportedLanguage
): string {
  return i18n.t(key, { ...options, lng: lng || getCurrentLanguage() })
}

/**
 * Add translation dynamically
 */
export function addTranslation(
  lng: SupportedLanguage,
  ns: string,
  key: string,
  value: string
): void {
  i18n.addResource(lng, ns, key, value)
  console.log(`Added translation: ${lng}.${ns}.${key}`)
}

/**
 * Check if translation exists
 */
export function hasTranslation(key: string, ns?: string): boolean {
  return i18n.exists(key, { ns: ns || DEFAULT_NAMESPACE })
}

// ============== Export ==============

export default i18n

// Type augmentation for better TypeScript support
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    Sentry?: {
      captureException: (error: Error, context?: any) => void
    }
  }
}
