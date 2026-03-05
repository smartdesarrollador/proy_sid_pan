import { createContext, useContext, useState } from 'react'
import es from '../locales/es'
import en from '../locales/en'

const LOCALES = { es, en }

const LanguageContext = createContext(null)

function resolve(obj, key) {
  return key.split('.').reduce((acc, k) => acc?.[k], obj) ?? key
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('hub-lang') ?? 'es'
  })

  const setLang = (newLang) => {
    if (LOCALES[newLang]) {
      setLangState(newLang)
      localStorage.setItem('hub-lang', newLang)
    }
  }

  const t = (key) => resolve(LOCALES[lang] ?? LOCALES.es, key)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider')
  return ctx
}
