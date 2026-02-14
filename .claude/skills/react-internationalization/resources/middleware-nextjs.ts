/**
 * Next.js Middleware for Locale Routing
 *
 * Handles automatic locale detection and routing:
 * - Detects user's preferred language
 * - Redirects to localized URLs (/en/*, /es/*, etc.)
 * - Persists locale in cookies
 * - Supports custom locale switching
 */

import { NextRequest, NextResponse } from 'next/server'
import Negotiator from 'negotiator'
import { match as matchLocale } from '@formatjs/intl-localematcher'

// ============== Configuration ==============

export const locales = ['en', 'es', 'fr', 'de'] as const
export const defaultLocale = 'en' as const

export type Locale = (typeof locales)[number]

const LOCALE_COOKIE = 'NEXT_LOCALE'

// ============== Helper Functions ==============

/**
 * Get locale from Accept-Language header
 */
function getLocaleFromHeader(request: NextRequest): Locale | undefined {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  const languages = new Negotiator({ headers }).languages()

  try {
    return matchLocale(languages, [...locales], defaultLocale) as Locale
  } catch {
    return undefined
  }
}

/**
 * Get locale from cookie
 */
function getLocaleFromCookie(request: NextRequest): Locale | undefined {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }
  return undefined
}

/**
 * Get locale from URL pathname
 */
function getLocaleFromPathname(pathname: string): Locale | undefined {
  const segments = pathname.split('/')
  const firstSegment = segments[1]

  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale
  }
  return undefined
}

/**
 * Get locale from query parameter (?lng=en)
 */
function getLocaleFromQuery(request: NextRequest): Locale | undefined {
  const searchParams = request.nextUrl.searchParams
  const queryLocale = searchParams.get('lng')

  if (queryLocale && locales.includes(queryLocale as Locale)) {
    return queryLocale as Locale
  }
  return undefined
}

/**
 * Determine the best locale for the user
 */
function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check query parameter (?lng=en)
  const queryLocale = getLocaleFromQuery(request)
  if (queryLocale) return queryLocale

  // 2. Check cookie
  const cookieLocale = getLocaleFromCookie(request)
  if (cookieLocale) return cookieLocale

  // 3. Check Accept-Language header
  const headerLocale = getLocaleFromHeader(request)
  if (headerLocale) return headerLocale

  // 4. Default locale
  return defaultLocale
}

// ============== Middleware ==============

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for certain paths
  const shouldSkip =
    pathname.startsWith('/_next') || // Next.js internals
    pathname.startsWith('/api') ||   // API routes
    pathname.startsWith('/static') || // Static files
    pathname.includes('.') ||         // Files with extensions
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'

  if (shouldSkip) {
    return NextResponse.next()
  }

  // Check if pathname already has a locale
  const pathnameLocale = getLocaleFromPathname(pathname)

  if (pathnameLocale) {
    // Pathname has locale, set cookie and continue
    const response = NextResponse.next()
    response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
      maxAge: 31536000, // 1 year
      path: '/',
      sameSite: 'lax',
    })
    return response
  }

  // Pathname doesn't have locale, redirect to localized URL
  const preferredLocale = getPreferredLocale(request)
  const redirectUrl = new URL(`/${preferredLocale}${pathname}`, request.url)

  // Preserve search params
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'lng') {
      redirectUrl.searchParams.set(key, value)
    }
  })

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set(LOCALE_COOKIE, preferredLocale, {
    maxAge: 31536000,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

// ============== Matcher Configuration ==============

export const config = {
  matcher: [
    // Match all pathnames except:
    // - /_next (Next.js internals)
    // - /api (API routes)
    // - /static (static files)
    // - Files with extensions (e.g., .jpg, .css)
    '/((?!_next|api|static|.*\\..*).*)',
  ],
}

// ============== Advanced Middleware with Rewrites ==============

/**
 * Advanced middleware with custom logic
 */
export function middlewareAdvanced(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for certain paths
  const shouldSkip =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')

  if (shouldSkip) {
    return NextResponse.next()
  }

  const pathnameLocale = getLocaleFromPathname(pathname)

  if (pathnameLocale) {
    // Pathname has locale
    const response = NextResponse.next()

    // Set locale cookie
    response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
      maxAge: 31536000,
      path: '/',
    })

    // Set custom headers for locale
    response.headers.set('x-locale', pathnameLocale)
    response.headers.set('x-default-locale', defaultLocale)

    return response
  }

  // Redirect to localized URL
  const preferredLocale = getPreferredLocale(request)
  const redirectUrl = new URL(`/${preferredLocale}${pathname}`, request.url)

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'lng') {
      redirectUrl.searchParams.set(key, value)
    }
  })

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set(LOCALE_COOKIE, preferredLocale, {
    maxAge: 31536000,
    path: '/',
  })
  response.headers.set('x-locale', preferredLocale)

  return response
}

// ============== Utility Functions for App ==============

/**
 * Get locale from params (for Server Components)
 */
export function getLocale(params: { locale?: string }): Locale {
  const { locale } = params
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }
  return defaultLocale
}

/**
 * Generate static params for all locales (for Static Generation)
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * Check if locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/**
 * Get localized URL
 */
export function getLocalizedUrl(pathname: string, locale: Locale): string {
  // Remove existing locale from pathname
  const segments = pathname.split('/')
  if (segments[1] && locales.includes(segments[1] as Locale)) {
    segments.splice(1, 1)
  }

  // Add new locale
  return `/${locale}${segments.join('/')}`
}

/**
 * Get alternate URLs for all locales (for SEO)
 */
export function getAlternateUrls(pathname: string, baseUrl: string) {
  return locales.map((locale) => ({
    locale,
    url: `${baseUrl}${getLocalizedUrl(pathname, locale)}`,
  }))
}

// ============== Types ==============

export interface LocaleParams {
  locale: Locale
}

export interface PageProps<T = {}> {
  params: LocaleParams & T
  searchParams?: { [key: string]: string | string[] | undefined }
}

// ============== Export ==============

export default middleware
