---
name: react-internationalization
description: >
  Guía completa de internacionalización (i18n) en React/Next.js con TypeScript, react-i18next, lazy loading y formateo de datos.
  Usar cuando se necesite: react-i18next setup, translation files (JSON, namespaces), useTranslation hook, lazy loading translations,
  language switching, formatting (fechas, números, monedas), pluralization, TypeScript integration (tipado de keys, autocomplete),
  Next.js integration (middleware, SSR, App Router). Incluye react-i18next como estándar, TypeScript strict, lazy loading,
  performance optimization, soporte multiidioma y mejores prácticas de producción.
---

# React Internationalization (i18n) - TypeScript

Guía completa para implementar internacionalización en aplicaciones React/Next.js con TypeScript, react-i18next y mejores prácticas de producción.

## 1. react-i18next Setup

react-i18next es la librería estándar de i18n para React, con soporte completo para TypeScript y features modernas.

### Instalación

```bash
# React
npm install react-i18next i18next

# Next.js (requiere paquetes adicionales)
npm install react-i18next i18next i18next-http-backend

# Para detección automática de idioma
npm install i18next-browser-languagedetector

# Para formateo de fechas/números
npm install date-fns
```

### Configuración Básica - i18n.ts

**src/i18n/i18n.ts:**
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import translationEN from './locales/en/translation.json'
import translationES from './locales/es/translation.json'
import translationFR from './locales/fr/translation.json'

// Resources object
const resources = {
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  fr: {
    translation: translationFR,
  },
} as const

i18n
  .use(LanguageDetector) // Detecta idioma del browser
  .use(initReactI18next) // Integración con React
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },

    // Detección de idioma
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n
```

### Inicialización en App

**React - main.tsx:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/i18n' // Inicializar i18n ANTES de App
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Next.js - app/layout.tsx:**
```typescript
import './i18n/i18n'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

---

## 2. Translation Files Structure

Organiza traducciones de forma escalable con namespaces y estructura por features.

### Estructura Básica

```
src/i18n/
├── i18n.ts                 # Configuración principal
└── locales/
    ├── en/
    │   ├── translation.json    # Traducciones generales
    │   ├── auth.json          # Namespace: autenticación
    │   ├── dashboard.json     # Namespace: dashboard
    │   └── products.json      # Namespace: productos
    ├── es/
    │   ├── translation.json
    │   ├── auth.json
    │   ├── dashboard.json
    │   └── products.json
    └── fr/
        ├── translation.json
        ├── auth.json
        ├── dashboard.json
        └── products.json
```

### Translation JSON Examples

**locales/en/translation.json:**
```json
{
  "common": {
    "welcome": "Welcome to {{appName}}",
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "profile": "Profile"
  },
  "validation": {
    "required": "This field is required",
    "email": "Invalid email address",
    "minLength": "Minimum {{count}} characters",
    "maxLength": "Maximum {{count}} characters"
  }
}
```

**locales/en/auth.json:**
```json
{
  "login": {
    "title": "Sign In",
    "email": "Email address",
    "password": "Password",
    "submit": "Sign In",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "signUp": "Sign Up"
  },
  "register": {
    "title": "Create Account",
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "submit": "Create Account",
    "hasAccount": "Already have an account?",
    "signIn": "Sign In"
  },
  "errors": {
    "invalidCredentials": "Invalid email or password",
    "emailTaken": "Email already in use",
    "weakPassword": "Password is too weak"
  }
}
```

**locales/es/translation.json:**
```json
{
  "common": {
    "welcome": "Bienvenido a {{appName}}",
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar"
  },
  "navigation": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto",
    "profile": "Perfil"
  },
  "validation": {
    "required": "Este campo es obligatorio",
    "email": "Dirección de correo inválida",
    "minLength": "Mínimo {{count}} caracteres",
    "maxLength": "Máximo {{count}} caracteres"
  }
}
```

### Nested Keys (Recommended)

```json
{
  "user": {
    "profile": {
      "title": "User Profile",
      "settings": {
        "privacy": "Privacy Settings",
        "notifications": "Notification Preferences",
        "account": {
          "delete": "Delete Account",
          "export": "Export Data"
        }
      }
    }
  }
}
```

---

## 3. useTranslation Hook

El hook principal para acceder a traducciones en componentes.

### Uso Básico

```typescript
import { useTranslation } from 'react-i18next'

function WelcomeMessage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common.welcome', { appName: 'MyApp' })}</h1>
      <p>{t('common.loading')}</p>
    </div>
  )
}
```

### Con Namespace

```typescript
import { useTranslation } from 'react-i18next'

function LoginForm() {
  const { t } = useTranslation('auth') // Namespace específico

  return (
    <form>
      <h2>{t('login.title')}</h2>
      <input type="email" placeholder={t('login.email')} />
      <input type="password" placeholder={t('login.password')} />
      <button>{t('login.submit')}</button>
    </form>
  )
}
```

### Interpolación

```typescript
function UserGreeting({ userName }: { userName: string }) {
  const { t } = useTranslation()

  return (
    <div>
      {/* Translation: "Hello, {{name}}! You have {{count}} new messages" */}
      <p>{t('greeting', { name: userName, count: 5 })}</p>
    </div>
  )
}
```

### Pluralización

**Translation:**
```json
{
  "notifications": {
    "newMessages_one": "You have {{count}} new message",
    "newMessages_other": "You have {{count}} new messages"
  },
  "items": {
    "cart_zero": "Your cart is empty",
    "cart_one": "{{count}} item in cart",
    "cart_other": "{{count}} items in cart"
  }
}
```

**Usage:**
```typescript
function NotificationBadge({ count }: { count: number }) {
  const { t } = useTranslation()

  return (
    <div>
      <p>{t('notifications.newMessages', { count })}</p>
      <p>{t('items.cart', { count })}</p>
    </div>
  )
}
```

### Context Support

Para variaciones de traducciones según contexto:

**Translation:**
```json
{
  "friend": "A friend",
  "friend_male": "A boyfriend",
  "friend_female": "A girlfriend"
}
```

**Usage:**
```typescript
function FriendLabel({ gender }: { gender: 'male' | 'female' }) {
  const { t } = useTranslation()

  return <span>{t('friend', { context: gender })}</span>
}
```

### Default Values

```typescript
function SafeTranslation() {
  const { t } = useTranslation()

  // Si "unknown.key" no existe, muestra "Default text"
  return <p>{t('unknown.key', 'Default text')}</p>
}
```

---

## 4. Lazy Loading Translations

Optimiza el bundle inicial cargando traducciones bajo demanda.

### Backend Plugin Setup

**i18n.ts con lazy loading:**
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(HttpBackend) // Load translations usando HTTP
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      // Path donde están los archivos de traducción
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Namespaces a cargar por default
    ns: ['translation'],
    defaultNS: 'translation',
  })

export default i18n
```

### Dynamic Import (Sin HTTP Backend)

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {}, // Vacío inicialmente
})

// Función para cargar idiomas dinámicamente
export async function loadLanguage(lng: string) {
  const resources = await import(`./locales/${lng}/translation.json`)
  i18n.addResourceBundle(lng, 'translation', resources.default, true, true)
  await i18n.changeLanguage(lng)
}

export default i18n
```

### Lazy Loading Namespaces

```typescript
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

function ProductsPage() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    // Cargar namespace "products" solo cuando se necesite
    i18n.loadNamespaces('products')
  }, [i18n])

  return <div>{t('products:title')}</div>
}
```

### Code Splitting por Idioma (Webpack)

**webpack.config.js:**
```javascript
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      cacheGroups: {
        locales: {
          test: /[\\/]locales[\\/]/,
          name: 'locales',
          chunks: 'all',
        },
      },
    },
  },
}
```

---

## 5. Language Switching

Permite a los usuarios cambiar de idioma con persistencia.

### Language Selector Component

**components/LanguageSelector.tsx:**
```typescript
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lng) => lng.code === i18n.language)

  const changeLanguage = async (code: string) => {
    await i18n.changeLanguage(code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
      >
        <span>{currentLanguage?.flag}</span>
        <span>{currentLanguage?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-white shadow-lg rounded-lg overflow-hidden">
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => changeLanguage(lng.code)}
              className={`flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 ${
                lng.code === i18n.language ? 'bg-blue-50' : ''
              }`}
            >
              <span>{lng.flag}</span>
              <span>{lng.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Persistencia en LocalStorage

react-i18next con LanguageDetector automáticamente guarda en localStorage:

```typescript
import LanguageDetector from 'i18next-browser-languagedetector'

i18n.use(LanguageDetector).init({
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'], // Guarda en localStorage
    lookupLocalStorage: 'i18nextLng', // Key en localStorage
  },
})
```

### Persistencia en Cookies (Next.js)

**lib/cookies.ts:**
```typescript
import Cookies from 'js-cookie'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

export function getLocaleFromCookie(): string | undefined {
  return Cookies.get(LOCALE_COOKIE)
}

export function setLocaleToCookie(locale: string) {
  Cookies.set(LOCALE_COOKIE, locale, { expires: 365 })
}
```

**i18n.ts con cookies:**
```typescript
import { getLocaleFromCookie, setLocaleToCookie } from './cookies'

i18n.on('languageChanged', (lng) => {
  setLocaleToCookie(lng)
})

const savedLocale = getLocaleFromCookie()
if (savedLocale) {
  i18n.changeLanguage(savedLocale)
}
```

### Detección Automática

```typescript
i18n.use(LanguageDetector).init({
  detection: {
    // Orden de detección
    order: [
      'querystring', // ?lng=en
      'cookie',      // Cookie
      'localStorage', // localStorage
      'navigator',   // Browser language
      'htmlTag',     // <html lang="en">
    ],
    caches: ['localStorage', 'cookie'],
  },
})
```

---

## 6. Formatting (Fechas, Números, Monedas)

Formatea datos según el locale activo.

### Fechas con date-fns

```bash
npm install date-fns
```

**utils/dateFormatter.ts:**
```typescript
import { format, formatDistance, formatRelative } from 'date-fns'
import { enUS, es, fr, de } from 'date-fns/locale'

const locales: Record<string, Locale> = { en: enUS, es, fr, de }

export function formatDate(date: Date, formatStr: string, locale: string) {
  return format(date, formatStr, {
    locale: locales[locale] || enUS,
  })
}

export function formatRelativeTime(date: Date, baseDate: Date, locale: string) {
  return formatRelative(date, baseDate, {
    locale: locales[locale] || enUS,
  })
}

export function formatTimeAgo(date: Date, locale: string) {
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: locales[locale] || enUS,
  })
}
```

**Usage:**
```typescript
import { useTranslation } from 'react-i18next'
import { formatDate, formatTimeAgo } from '@/utils/dateFormatter'

function PostCard({ date }: { date: Date }) {
  const { i18n } = useTranslation()

  return (
    <div>
      <time>{formatDate(date, 'PPP', i18n.language)}</time>
      <span>{formatTimeAgo(date, i18n.language)}</span>
    </div>
  )
}
```

### Números con Intl.NumberFormat

```typescript
export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatCurrency(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value)
}
```

**Usage:**
```typescript
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatNumber } from '@/utils/numberFormatter'

function PriceDisplay({ price }: { price: number }) {
  const { i18n } = useTranslation()

  return (
    <div>
      <p>{formatCurrency(price, i18n.language, 'USD')}</p>
      <p>{formatNumber(price, i18n.language)}</p>
    </div>
  )
}
```

### Custom Format Hook

```typescript
import { useTranslation } from 'react-i18next'
import { formatDate, formatCurrency } from '@/utils/formatters'

export function useFormat() {
  const { i18n } = useTranslation()

  return {
    formatDate: (date: Date, formatStr: string) =>
      formatDate(date, formatStr, i18n.language),

    formatCurrency: (value: number, currency: string) =>
      formatCurrency(value, i18n.language, currency),

    formatNumber: (value: number) =>
      new Intl.NumberFormat(i18n.language).format(value),

    formatPercent: (value: number) =>
      new Intl.NumberFormat(i18n.language, {
        style: 'percent',
      }).format(value),
  }
}
```

**Usage:**
```typescript
function Dashboard() {
  const format = useFormat()

  return (
    <div>
      <p>{format.formatCurrency(99.99, 'USD')}</p>
      <p>{format.formatDate(new Date(), 'PPP')}</p>
      <p>{format.formatPercent(0.15)}</p>
    </div>
  )
}
```

---

## 7. Pluralization Rules

Reglas de plural varían por idioma (inglés: singular/plural, español/francés: 0/1/many, árabe: 6 formas).

### Plural Forms

**English (2 forms):**
```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}
```

**Spanish/French (2 forms también):**
```json
{
  "items_one": "{{count}} artículo",
  "items_other": "{{count}} artículos"
}
```

**Complex Plurals (con zero):**
```json
{
  "notifications_zero": "No notifications",
  "notifications_one": "{{count}} notification",
  "notifications_other": "{{count}} notifications"
}
```

### Advanced Pluralization

**Custom plural rules:**
```typescript
import i18n from 'i18next'

i18n.init({
  // ...
  pluralSeparator: '_',
})

// Usage
t('key', { count: 0 })  // key_zero
t('key', { count: 1 })  // key_one
t('key', { count: 5 })  // key_other
```

### Intervalos (Ordinals)

```json
{
  "timeLeft_zero": "No time left",
  "timeLeft_1": "1 second",
  "timeLeft_2-10": "{{count}} seconds",
  "timeLeft_other": "{{count}} seconds"
}
```

**Usage:**
```typescript
function Countdown({ seconds }: { seconds: number }) {
  const { t } = useTranslation()

  return <p>{t('timeLeft', { count: seconds })}</p>
}
```

---

## 8. TypeScript Integration

Tipado completo de translation keys con autocomplete y type safety.

### Declaration Merging

**types/i18next.d.ts:**
```typescript
import 'react-i18next'
import translation from '@/i18n/locales/en/translation.json'
import auth from '@/i18n/locales/en/auth.json'
import dashboard from '@/i18n/locales/en/dashboard.json'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof translation
      auth: typeof auth
      dashboard: typeof dashboard
    }
  }
}
```

### Type-Safe Hook

Con la declaración anterior, el hook `useTranslation` tiene autocomplete:

```typescript
function LoginForm() {
  const { t } = useTranslation('auth')

  // Autocomplete para "login.title", "login.email", etc.
  return <h1>{t('login.title')}</h1>
}
```

### Type-Safe Trans Component

```typescript
import { Trans, useTranslation } from 'react-i18next'

function TermsAcceptance() {
  const { t } = useTranslation()

  return (
    <Trans
      i18nKey="auth.register.termsText"
      components={{
        link: <a href="/terms" className="text-blue-600" />,
      }}
    />
  )
}
```

**Translation:**
```json
{
  "auth": {
    "register": {
      "termsText": "I agree to the <link>Terms and Conditions</link>"
    }
  }
}
```

### Typed Translation Function

```typescript
type TranslationKey =
  | 'common.welcome'
  | 'common.loading'
  | 'auth.login.title'
  | 'auth.login.submit'

function typedT(key: TranslationKey, params?: Record<string, any>): string {
  const { t } = useTranslation()
  return t(key, params)
}
```

### Generate Types from JSON (Advanced)

```bash
npm install -D i18next-resources-to-backend @types/i18next
```

**scripts/generate-i18n-types.ts:**
```typescript
import fs from 'fs'
import path from 'path'

const localesPath = path.join(__dirname, '../src/i18n/locales/en')
const files = fs.readdirSync(localesPath)

let types = 'declare module "react-i18next" {\n'
types += '  interface CustomTypeOptions {\n'
types += '    resources: {\n'

files.forEach((file) => {
  const namespace = file.replace('.json', '')
  types += `      ${namespace}: typeof import('../i18n/locales/en/${file}');\n`
})

types += '    }\n'
types += '  }\n'
types += '}\n'

fs.writeFileSync(path.join(__dirname, '../src/types/i18next.d.ts'), types)
```

---

## 9. Next.js Integration

Integración completa con Next.js App Router y middleware.

### App Router Setup

**i18n/settings.ts:**
```typescript
export const fallbackLng = 'en'
export const languages = ['en', 'es', 'fr', 'de'] as const
export const defaultNS = 'translation'

export type Locale = (typeof languages)[number]

export function getOptions(lng = fallbackLng, ns: string | string[] = defaultNS) {
  return {
    lng,
    fallbackLng,
    supportedLngs: languages,
    defaultNS,
    ns,
  }
}
```

**i18n/index.ts:**
```typescript
import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next/initReactI18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getOptions, Locale } from './settings'

async function initI18next(lng: Locale, ns?: string | string[]) {
  const i18nInstance = createInstance()

  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`./locales/${language}/${namespace}.json`)
      )
    )
    .init(getOptions(lng, ns))

  return i18nInstance
}

export async function useTranslation(
  lng: Locale,
  ns?: string | string[],
  options: { keyPrefix?: string } = {}
) {
  const i18nextInstance = await initI18next(lng, ns)
  return {
    t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns, options.keyPrefix),
    i18n: i18nextInstance,
  }
}
```

### Middleware para Locale Routing

**middleware.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { languages, fallbackLng } from './i18n/settings'

function getLocale(request: NextRequest): string {
  // 1. Check URL path
  const pathname = request.nextUrl.pathname
  const pathnameLocale = languages.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (pathnameLocale) return pathnameLocale

  // 2. Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && languages.includes(cookieLocale as any)) {
    return cookieLocale
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const browserLocale = acceptLanguage.split(',')[0].split('-')[0]
    if (languages.includes(browserLocale as any)) {
      return browserLocale
    }
  }

  return fallbackLng
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if pathname already has locale
  const pathnameHasLocale = languages.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // Redirect to locale path
  const locale = getLocale(request)
  const response = NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  )
  response.cookies.set('NEXT_LOCALE', locale, { maxAge: 31536000 })
  return response
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}
```

### App Directory Structure

```
app/
├── [locale]/
│   ├── layout.tsx          # Root layout con locale
│   ├── page.tsx            # Home page
│   ├── about/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
└── api/
    └── ...
```

### Server Component Translation

**app/[locale]/page.tsx:**
```typescript
import { useTranslation } from '@/i18n'
import { Locale } from '@/i18n/settings'

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const { t } = await useTranslation(params.locale)

  return (
    <div>
      <h1>{t('common.welcome', { appName: 'Next.js' })}</h1>
      <p>{t('common.description')}</p>
    </div>
  )
}
```

### Client Component Translation

**app/[locale]/components/ClientComponent.tsx:**
```typescript
'use client'

import { useTranslation } from 'react-i18next'

export function ClientComponent() {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div>
      <p>{t('common.hello')}</p>
      <button onClick={() => changeLanguage('es')}>Español</button>
    </div>
  )
}
```

### TranslationsProvider (Client-Side i18n)

**app/[locale]/providers.tsx:**
```typescript
'use client'

import { I18nextProvider } from 'react-i18next'
import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ReactNode, useEffect } from 'react'
import { Locale } from '@/i18n/settings'

export function TranslationsProvider({
  children,
  locale,
  resources,
}: {
  children: ReactNode
  locale: Locale
  resources: any
}) {
  const i18n = createInstance()

  i18n.use(initReactI18next).init({
    lng: locale,
    resources,
    fallbackLng: 'en',
  })

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
```

---

## 10. Best Practices

### Keys Naming Conventions

```json
{
  "// Estructura": "namespace.section.key",
  "// Ejemplos:": "",

  "common.actions.save": "Save",
  "common.actions.cancel": "Cancel",
  "common.actions.delete": "Delete",

  "auth.login.title": "Sign In",
  "auth.login.submit": "Sign In",
  "auth.register.title": "Create Account",

  "validation.required": "This field is required",
  "validation.email.invalid": "Invalid email",
  "validation.password.weak": "Weak password",

  "errors.network.timeout": "Connection timeout",
  "errors.server.internal": "Internal server error",

  "products.list.title": "Product List",
  "products.detail.description": "Description",
  "products.create.success": "Product created successfully"
}
```

**Reglas:**
- Usar dot notation (`auth.login.title`)
- Prefijo por feature/módulo (`auth`, `products`)
- Plural para arrays/listas (`users.list`, `items.cart`)
- Verbos en infinitivo (`save`, `delete`, `create`)
- Mensajes de error prefijo `errors.`
- Validaciones prefijo `validation.`

### Fallback Languages

```typescript
i18n.init({
  fallbackLng: {
    'en-US': ['en'],
    'es-MX': ['es'],
    'es-AR': ['es'],
    default: ['en'],
  },
})
```

### Missing Translations Handling

```typescript
i18n.init({
  saveMissing: true, // Save missing keys
  missingKeyHandler: (lngs, ns, key, fallbackValue) => {
    console.warn(`Missing translation: ${key} for ${lngs}`)
    // Enviar a servicio de tracking
  },
})
```

### Translation JSON Validation

```bash
npm install -D ajv
```

**scripts/validate-translations.ts:**
```typescript
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'

const ajv = new Ajv()

const enTranslation = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../i18n/locales/en/translation.json'), 'utf8')
)

function getKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).flatMap((key) => {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return getKeys(obj[key], newKey)
    }
    return [newKey]
  })
}

const enKeys = new Set(getKeys(enTranslation))

// Validar que español tenga las mismas keys
const esTranslation = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../i18n/locales/es/translation.json'), 'utf8')
)
const esKeys = new Set(getKeys(esTranslation))

const missingKeys = [...enKeys].filter((key) => !esKeys.has(key))
if (missingKeys.length > 0) {
  console.error('Missing keys in Spanish:', missingKeys)
  process.exit(1)
}
```

### Continuous Localization

```yaml
# .github/workflows/translations.yml
name: Validate Translations

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run validate:translations
```

### Performance Tips

1. **Lazy load namespaces**: Solo cargar lo necesario
2. **Code splitting**: Separar traducciones por bundle
3. **Caching**: Cachear traducciones en localStorage
4. **Minimize JSON size**: Evitar duplicados
5. **Use TranslationsProvider**: Para compartir instancia en cliente

### Testing Translations

```typescript
import { renderHook } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'

describe('useTranslation', () => {
  it('should translate keys correctly', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    )

    const { result } = renderHook(() => useTranslation(), { wrapper })

    expect(result.current.t('common.welcome', { appName: 'Test' })).toBe(
      'Welcome to Test'
    )
  })
})
```

---

## Resources

Ver archivos en `resources/` para:
- `translation-structure.json` - Ejemplo completo de estructura de traducciones
- `i18n-config-example.ts` - Configuración avanzada de i18next
- `language-selector-component.tsx` - Componente selector de idioma completo
- `middleware-nextjs.ts` - Middleware de Next.js para locale routing

---

## Summary

**Setup:**
1. Instalar `react-i18next`, `i18next`, `i18next-browser-languagedetector`
2. Crear `i18n.ts` con configuración
3. Importar en entry point de la app

**Translations:**
1. Organizar por namespaces (`translation.json`, `auth.json`, etc.)
2. Usar dot notation para keys (`auth.login.title`)
3. Soportar interpolación y pluralización

**Usage:**
1. `useTranslation()` hook en componentes
2. `t('key', { params })` para traducciones
3. Lazy loading para optimizar bundle

**TypeScript:**
1. Declarar tipos en `types/i18next.d.ts`
2. Autocomplete en `t()` function
3. Type safety en todas las keys

**Next.js:**
1. Middleware para locale routing
2. Server Components con `await useTranslation()`
3. Client Components con `I18nextProvider`

**Best Practices:**
1. Keys naming conventions
2. Fallback languages
3. Missing translations handling
4. Validate translations en CI/CD
5. Performance optimization

Esta guía cubre internacionalización end-to-end en React/Next.js con TypeScript, desde setup hasta producción.
