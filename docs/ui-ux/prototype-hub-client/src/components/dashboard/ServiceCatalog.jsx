import { MOCK_SERVICES } from '../../data/mockServices'
import ServiceCard from './ServiceCard'
import { useTranslation } from '../../contexts/LanguageContext'

export default function ServiceCatalog({ onNavigate }) {
  const { t } = useTranslation()
  const handleUpgrade = () => onNavigate?.('subscription')
  const handleSupport = () => onNavigate?.('support')

  const activeServices = MOCK_SERVICES.filter(
    (s) => s.status === 'active' || s.status === 'suspended'
  )
  const unavailableServices = MOCK_SERVICES.filter(
    (s) => s.status === 'locked' || s.status === 'coming_soon'
  )

  return (
    <div className="space-y-8">
      {/* Active services */}
      {activeServices.length > 0 && (
        <section aria-labelledby="active-services-heading">
          <h2 id="active-services-heading" className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            {t('serviceCatalog.activeTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onUpgrade={handleUpgrade}
                onSupport={handleSupport}
              />
            ))}
          </div>
        </section>
      )}

      {/* Unavailable services */}
      {unavailableServices.length > 0 && (
        <section aria-labelledby="more-services-heading">
          <h2 id="more-services-heading" className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {t('serviceCatalog.unavailableTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('serviceCatalog.unavailableSub')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unavailableServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onUpgrade={handleUpgrade}
                onSupport={handleSupport}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
