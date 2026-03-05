import { useState } from 'react'
import { Shield, Bell, Globe, Save, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'

function SaveButton({ loading, saved, t }) {
  return (
    <button type="submit" disabled={loading} className="btn-primary">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('profile.saving')}
        </>
      ) : saved ? (
        <>
          <CheckCircle className="w-4 h-4" />
          {t('profile.saved')}
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          {t('profile.save')}
        </>
      )}
    </button>
  )
}

function AccountTab({ user }) {
  const { t } = useTranslation()
  const [name, setName] = useState(user?.name ?? '')
  const [email] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('profile.nameField')}
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base"
          required
        />
      </div>

      <div>
        <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('profile.emailField')}
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          readOnly
          className="input-base bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          aria-readonly="true"
          aria-describedby="email-hint"
        />
        <p id="email-hint" className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('profile.emailHint')}
        </p>
      </div>

      <div className="pt-2">
        <SaveButton loading={loading} saved={saved} t={t} />
      </div>
    </form>
  )
}

function SecurityTab() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setSaved(true)
    setForm({ current: '', new: '', confirm: '' })
    setTimeout(() => setSaved(false), 3000)
  }

  const handleMFAToggle = async () => {
    setMfaLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setMfaEnabled((v) => !v)
    setMfaLoading(false)
  }

  const fields = [
    { id: 'current', label: t('profile.currentPwd'), placeholder: t('profile.pwdPlaceholder') },
    { id: 'new', label: t('profile.newPwd'), placeholder: t('profile.newPwdPlaceholder') },
    { id: 'confirm', label: t('profile.confirmPwd'), placeholder: t('profile.pwdPlaceholder') },
  ]

  return (
    <div className="space-y-8">
      {/* Password change */}
      <section aria-labelledby="password-section">
        <h3 id="password-section" className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          {t('profile.changePwd')}
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          {fields.map((field) => (
            <div key={field.id}>
              <label
                htmlFor={`pwd-${field.id}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {field.label}
              </label>
              <div className="relative">
                <input
                  id={`pwd-${field.id}`}
                  type={showPasswords ? 'text' : 'password'}
                  value={form[field.id]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="input-base pr-10"
                  required
                />
                {field.id === 'current' && (
                  <button
                    type="button"
                    onClick={() => setShowPasswords((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showPasswords ? t('profile.hidePwd') : t('profile.showPwd')}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="pt-1">
            <SaveButton loading={loading} saved={saved} t={t} />
          </div>
        </form>
      </section>

      {/* MFA */}
      <section className="pt-6 border-t border-gray-100 dark:border-gray-700" aria-labelledby="mfa-section">
        <h3 id="mfa-section" className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {t('profile.mfaSection')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('profile.mfaSub')}
        </p>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className={`w-5 h-5 ${mfaEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {mfaEnabled ? t('profile.mfaEnabled') : t('profile.mfaDisabled')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mfaEnabled ? t('profile.mfaEnabledSub') : t('profile.mfaDisabledSub')}
              </p>
            </div>
          </div>
          <button
            onClick={handleMFAToggle}
            disabled={mfaLoading}
            aria-pressed={mfaEnabled}
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
              mfaEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600',
              mfaLoading ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
            aria-label={mfaEnabled ? t('profile.deactivateMfa') : t('profile.activateMfa')}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                mfaEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  )
}

function PreferencesTab() {
  const { t, lang, setLang } = useTranslation()
  const [timezone, setTimezone] = useState('America/Mexico_City')
  const [notifications, setNotifications] = useState({
    billing: true,
    updates: true,
    security: true,
    marketing: false,
  })

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const NOTIFICATION_ITEMS = [
    { key: 'billing', label: t('profile.notifBilling'), description: t('profile.notifBillingDesc') },
    { key: 'updates', label: t('profile.notifUpdates'), description: t('profile.notifUpdatesDesc') },
    { key: 'security', label: t('profile.notifSecurity'), description: t('profile.notifSecurityDesc'), readonly: true },
    { key: 'marketing', label: t('profile.notifMarketing'), description: t('profile.notifMarketingDesc') },
  ]

  return (
    <div className="space-y-8">
      {/* Language & Timezone */}
      <section aria-labelledby="interface-section">
        <h3 id="interface-section" className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          {t('profile.langSection')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('profile.langField')}
            </label>
            <select
              id="language-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="input-base"
              aria-label={t('profile.langField')}
            >
              <option value="es">{t('profile.langEs')}</option>
              <option value="en">{t('profile.langEn')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="timezone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('profile.timezoneField')}
            </label>
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input-base"
              aria-label={t('profile.timezoneField')}
            >
              <option value="America/Mexico_City">{t('profile.tz1')}</option>
              <option value="America/Bogota">{t('profile.tz2')}</option>
              <option value="America/Buenos_Aires">{t('profile.tz3')}</option>
              <option value="America/New_York">{t('profile.tz4')}</option>
              <option value="Europe/Madrid">{t('profile.tz5')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="pt-6 border-t border-gray-100 dark:border-gray-700" aria-labelledby="notifications-section">
        <h3 id="notifications-section" className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          {t('profile.notifSection')}
        </h3>
        <ul className="space-y-3" role="list">
          {NOTIFICATION_ITEMS.map((item) => (
            <li key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
              </div>
              <button
                onClick={() => !item.readonly && toggleNotification(item.key)}
                disabled={item.readonly}
                aria-pressed={notifications[item.key]}
                aria-label={`${item.label}: ${notifications[item.key] ? t('profile.on') : t('profile.off')}`}
                className={[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
                  notifications[item.key] ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600',
                  item.readonly ? 'opacity-60 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function ProfileView() {
  const { user } = useAuth()
  const { t, lang } = useTranslation()
  const [activeTab, setActiveTab] = useState('account')

  const TABS = [
    { id: 'account', label: t('profile.tabAccount') },
    { id: 'security', label: t('profile.tabSecurity') },
    { id: 'preferences', label: t('profile.tabPreferences') },
  ]

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const memberSince = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
        year: 'numeric',
        month: 'long',
      })
    : t('common.january2025')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <aside className="lg:col-span-1">
          <div className="card p-6 text-center">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md">
              {initials}
            </div>

            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>

            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full border border-indigo-200 dark:border-indigo-700">
                {user?.planLabel ?? t('common.free')} {t('common.plan')}
              </span>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 text-left space-y-3">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
                  {t('profile.billing')}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{user?.billingStatus ?? t('common.upToDate')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
                  {t('profile.memberSince')}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{memberSince}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
                  {t('profile.openTickets')}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{user?.openTickets ?? 0}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {/* Tab navigation */}
            <nav
              className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              aria-label="Secciones del perfil"
              role="tablist"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tab-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'px-5 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-700 dark:text-primary-400 bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Tab content */}
            <div className="p-6 bg-white dark:bg-gray-900">
              <div
                id="tab-panel-account"
                role="tabpanel"
                aria-labelledby="tab-account"
                hidden={activeTab !== 'account'}
              >
                {activeTab === 'account' && <AccountTab user={user} />}
              </div>
              <div
                id="tab-panel-security"
                role="tabpanel"
                aria-labelledby="tab-security"
                hidden={activeTab !== 'security'}
              >
                {activeTab === 'security' && <SecurityTab />}
              </div>
              <div
                id="tab-panel-preferences"
                role="tabpanel"
                aria-labelledby="tab-preferences"
                hidden={activeTab !== 'preferences'}
              >
                {activeTab === 'preferences' && <PreferencesTab />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
