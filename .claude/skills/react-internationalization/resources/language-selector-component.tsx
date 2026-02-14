/**
 * Language Selector Component
 *
 * A production-ready, accessible language selector component with:
 * - Dropdown UI
 * - Keyboard navigation
 * - Accessibility (ARIA)
 * - Tailwind CSS styling
 * - TypeScript support
 * - Flag emojis
 */

import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Globe } from 'lucide-react'

// ============== Types ==============

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  dir?: 'ltr' | 'rtl'
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
] as const

// ============== Dropdown Component ==============

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = LANGUAGES.find((lng) => lng.code === i18n.language) || LANGUAGES[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const changeLanguage = async (code: string) => {
    await i18n.changeLanguage(code)
    setIsOpen(false)

    // Update HTML dir attribute for RTL languages
    const language = LANGUAGES.find((lng) => lng.code === code)
    if (language?.dir) {
      document.documentElement.dir = language.dir
    } else {
      document.documentElement.dir = 'ltr'
    }
  }

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xl" role="img" aria-label={currentLanguage.name}>
          {currentLanguage.flag}
        </span>
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="listbox"
          aria-label="Language options"
        >
          <div className="py-1 max-h-96 overflow-y-auto">
            {LANGUAGES.map((language) => {
              const isActive = language.code === i18n.language

              return (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" role="img" aria-label={language.name}>
                      {language.flag}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">{language.nativeName}</span>
                      <span className="text-xs text-gray-500">{language.name}</span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============== Simple Button Component ==============

export function LanguageSelectorSimple() {
  const { i18n } = useTranslation()

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
  ]

  return (
    <div className="flex items-center gap-2">
      {languages.map((lng) => (
        <button
          key={lng.code}
          onClick={() => i18n.changeLanguage(lng.code)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            i18n.language === lng.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={`Switch to ${lng.label}`}
        >
          {lng.label}
        </button>
      ))}
    </div>
  )
}

// ============== Native Select Component ==============

export function LanguageSelectorNative() {
  const { i18n } = useTranslation()

  return (
    <div className="relative inline-block">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="appearance-none px-4 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        aria-label="Select language"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.nativeName}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

// ============== Menu Item Component (for Navigation) ==============

export function LanguageMenuItem() {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = LANGUAGES.find((lng) => lng.code === i18n.language) || LANGUAGES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Globe className="w-4 h-4" />
        <span>{t('settings.language', 'Language')}</span>
        <span className="ml-auto text-gray-500">{currentLanguage.nativeName}</span>
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 space-y-1">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                i18n.changeLanguage(language.code)
                setIsOpen(false)
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm rounded-lg transition-colors ${
                language.code === i18n.language
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.nativeName}</span>
              {language.code === i18n.language && (
                <Check className="w-4 h-4 ml-auto text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============== Floating Action Button ==============

export function LanguageFAB() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = LANGUAGES.find((lng) => lng.code === i18n.language) || LANGUAGES[0]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        aria-label="Change language"
      >
        <span className="text-2xl">{currentLanguage.flag}</span>
      </button>

      {/* Language List */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="p-2 space-y-1">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  i18n.changeLanguage(language.code)
                  setIsOpen(false)
                }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  language.code === i18n.language
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span>{language.nativeName}</span>
                {language.code === i18n.language && (
                  <Check className="w-4 h-4 ml-auto text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============== Export ==============

export default LanguageSelector
