import { useState } from 'react'
import {
  Grid,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  CreditCard,
  HeadphonesIcon,
  UserCircle,
  Moon,
  Sun,
  Globe,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from '../contexts/LanguageContext'

export default function Navbar({ currentView, onNavigate }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { lang, setLang, t } = useTranslation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const NAV_LINKS = [
    { id: 'dashboard', label: t('navbar.dashboard'), icon: LayoutDashboard },
    { id: 'services', label: t('navbar.services'), icon: Layers },
    { id: 'subscription', label: t('navbar.subscription'), icon: CreditCard },
    { id: 'support', label: t('navbar.support'), icon: HeadphonesIcon },
    { id: 'profile', label: t('navbar.profile'), icon: UserCircle },
  ]

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
  }

  const handleNavigate = (view) => {
    onNavigate(view)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  const notificationCount = user?.openTickets ?? 0

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm z-30">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-1"
            aria-label={t('navbar.goToDashboard')}
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Grid className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg hidden sm:block">Hub</span>
          </button>
        </div>

        {/* Center: Desktop nav links */}
        <nav aria-label="Navegacion principal" className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavigate(link.id)}
              aria-current={currentView === link.id ? 'page' : undefined}
              className={[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500',
                currentView === link.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Plan badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
            {user?.planLabel ?? t('common.free')}
          </span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            aria-label={t('common.language')}
            title={t('common.language')}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang.toUpperCase()}
          </button>

          {/* Notification bell */}
          <button
            onClick={() => handleNavigate('support')}
            aria-label={`${notificationCount} ${t('navbar.tickets')}`}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label={t('navbar.userMenu')}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => handleNavigate('profile')}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {t('navbar.viewProfile')}
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('navbar.logout')}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={t('navbar.openMenu')}
            className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-md">
          <nav className="px-4 py-3 space-y-1" aria-label="Navegacion movil">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavigate(link.id)}
                  aria-current={currentView === link.id ? 'page' : undefined}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
                    currentView === link.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              )
            })}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
              {/* Mobile theme + lang row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                  {lang === 'es' ? 'ES → EN' : 'EN → ES'}
                </button>
              </div>

              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('navbar.logout')}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
