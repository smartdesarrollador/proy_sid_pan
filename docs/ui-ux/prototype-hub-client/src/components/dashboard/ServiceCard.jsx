import {
  Layout,
  Globe,
  Monitor,
  BarChart3,
  FileText,
  ExternalLink,
  Lock,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  Headphones,
} from 'lucide-react'
import { useSSO } from '../../hooks/useSSO'
import { useTranslation } from '../../contexts/LanguageContext'

const ICON_MAP = {
  Layout,
  Globe,
  Monitor,
  BarChart3,
  FileText,
}

function StatusBadge({ status }) {
  const { t } = useTranslation()

  if (status === 'active') {
    return (
      <span className="badge-active gap-1">
        <CheckCircle className="w-3 h-3" />
        {t('serviceCard.active')}
      </span>
    )
  }
  if (status === 'suspended') {
    return (
      <span className="badge-suspended gap-1">
        <AlertCircle className="w-3 h-3" />
        {t('serviceCard.suspended')}
      </span>
    )
  }
  if (status === 'locked') {
    return (
      <span className="badge-inactive gap-1">
        <Lock className="w-3 h-3" />
        {t('serviceCard.locked')}
      </span>
    )
  }
  if (status === 'coming_soon') {
    return (
      <span className="badge-soon gap-1">
        <Clock className="w-3 h-3" />
        {t('serviceCard.comingSoon')}
      </span>
    )
  }
  return null
}

export default function ServiceCard({ service, onUpgrade, onSupport }) {
  const { navigateToService } = useSSO()
  const { t } = useTranslation()
  const Icon = ICON_MAP[service.icon] ?? Layout

  const PLAN_LABEL = {
    starter: t('serviceCard.planStarter'),
    professional: t('serviceCard.planPro'),
    enterprise: t('serviceCard.planEnterprise'),
  }

  function relativeTime(isoString) {
    if (!isoString) return null
    const diff = Date.now() - new Date(isoString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('serviceCard.moments')
    if (minutes < 60) return t('serviceCard.min').replace('{n}', minutes)
    if (hours < 24) return t('serviceCard.hours').replace('{n}', hours)
    if (days === 1) return t('serviceCard.day')
    return t('serviceCard.days').replace('{n}', days)
  }

  const lastAccessed = relativeTime(service.lastAccessed)

  const handleAction = () => {
    if (service.status === 'active') {
      navigateToService(service)
    } else if (service.status === 'suspended') {
      onSupport?.()
    } else if (service.status === 'locked') {
      onUpgrade?.()
    }
  }

  return (
    <article
      className="service-card flex flex-col overflow-hidden"
      aria-label={`Servicio: ${service.name}`}
    >
      {/* Colored left border accent */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: service.color }}
        aria-hidden="true"
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${service.color}18` }}
              aria-hidden="true"
            >
              <Icon className="w-5 h-5" style={{ color: service.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{service.name}</h3>
              {lastAccessed && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {t('serviceCard.lastAccess')}: {lastAccessed}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={service.status} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 flex-1">{service.description}</p>

        {/* Locked plan info */}
        {service.status === 'locked' && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('serviceCard.requires')}{' '}
              <strong className="text-gray-700 dark:text-gray-300">
                {PLAN_LABEL[service.minPlan] ?? service.minPlan}
              </strong>
            </span>
          </div>
        )}

        {/* Action button */}
        {service.status === 'active' && (
          <button
            onClick={handleAction}
            className="btn-primary w-full justify-center"
            aria-label={`${t('serviceCard.openLabel')} ${service.name}`}
          >
            {t('serviceCard.open')}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        {service.status === 'suspended' && (
          <button
            onClick={handleAction}
            className="btn-secondary w-full justify-center"
            aria-label={`${t('serviceCard.supportLabel')} ${service.name}`}
          >
            <Headphones className="w-4 h-4" />
            {t('serviceCard.contactSupport')}
          </button>
        )}

        {service.status === 'locked' && (
          <button
            onClick={handleAction}
            className="w-full justify-center inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors border border-indigo-200 dark:border-indigo-700"
            aria-label={`${t('serviceCard.upgradeLabelPre')} ${service.name}`}
          >
            <ArrowUp className="w-4 h-4" />
            {t('serviceCard.seePlans')}
          </button>
        )}

        {service.status === 'coming_soon' && (
          <button
            disabled
            className="w-full justify-center inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed border border-gray-200 dark:border-gray-700"
            aria-disabled="true"
          >
            <Clock className="w-4 h-4" />
            {t('serviceCard.soon')}
          </button>
        )}
      </div>
    </article>
  )
}
