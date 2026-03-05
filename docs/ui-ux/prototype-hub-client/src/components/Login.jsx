import { useState } from 'react'
import { Grid, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/LanguageContext'

export default function Login({ onGoToLanding }) {
  const { login, isLoading } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || t('login.error'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Grid className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('login.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('login.subtitle')}</p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('login.heading')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="input-base"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('login.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="input-base"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"
              >
                <span className="mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('login.loading')}
                </>
              ) : (
                <>
                  {t('login.submit')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 px-3 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-0.5">{t('login.hintTitle')}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">{t('login.hintBody')}</p>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          {t('login.noAccount')}{' '}
          <button
            onClick={onGoToLanding}
            className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 hover:underline focus:outline-none focus:underline"
          >
            {t('login.seePlans')}
            <ArrowRight className="inline w-3.5 h-3.5 ml-0.5" />
          </button>
        </p>
      </div>
    </div>
  )
}
