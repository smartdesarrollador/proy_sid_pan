import { useState } from 'react'
import { Bell, CreditCard, Shield, Layers, Settings, CheckCheck } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { MOCK_NOTIFICATIONS } from '../../data/mockServices'

const CATEGORY_ICON = {
  billing:  CreditCard,
  security: Shield,
  services: Layers,
  system:   Settings,
}

const CATEGORY_COLOR = {
  billing:  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  security: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  services: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  system:   'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

function relativeTime(iso, t) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)  return t('notifications.justNow')
  if (diff < 3600) return t('notifications.minAgo').replace('{n}', Math.floor(diff / 60))
  if (diff < 86400) return t('notifications.hoursAgo').replace('{n}', Math.floor(diff / 3600))
  return t('notifications.daysAgo').replace('{n}', Math.floor(diff / 86400))
}

const FILTERS = ['all', 'billing', 'security', 'services', 'system']

export default function NotificationsView() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [activeFilter, setActiveFilter] = useState('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAll = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const markOne = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))

  const visible = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notifications.title')}</h1>
        </div>
        <button
          onClick={markAll}
          disabled={unreadCount === 0}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            unreadCount > 0
              ? 'btn-secondary'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed',
          ].join(' ')}
        >
          <CheckCheck className="w-4 h-4" />
          {t('notifications.markAllRead')}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar notificaciones">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={activeFilter === f}
            onClick={() => setActiveFilter(f)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
              activeFilter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {t(`notifications.${f}`)}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 dark:text-gray-500">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('notifications.noNotifications')}</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {visible.map((notif) => {
            const Icon = CATEGORY_ICON[notif.category] ?? Bell
            return (
              <button
                key={notif.id}
                onClick={() => markOne(notif.id)}
                className={[
                  'w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                  !notif.read ? 'bg-primary-50/40 dark:bg-primary-900/10' : '',
                ].join(' ')}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${CATEGORY_COLOR[notif.category]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" aria-label="No leida" />
                    )}
                    <p className={`text-sm font-semibold truncate ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                      {notif.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5 whitespace-nowrap">
                  {relativeTime(notif.createdAt, t)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
