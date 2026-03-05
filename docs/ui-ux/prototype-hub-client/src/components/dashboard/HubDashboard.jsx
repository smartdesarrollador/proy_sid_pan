import { CreditCard, Receipt, Headphones, Plus, ArrowRight, Gift } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { MOCK_SERVICES, MOCK_REFERRALS } from '../../data/mockServices'
import ServiceCard from './ServiceCard'

function SummaryCard({ icon: Icon, iconBg, label, value, sub, action, onAction }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 focus:outline-none focus:underline"
        >
          {action}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default function HubDashboard({ onNavigate }) {
  const { user } = useAuth()
  const { t, lang } = useTranslation()

  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const activeServices = MOCK_SERVICES.filter(
    (s) => s.status === 'active' || s.status === 'suspended'
  )
  const unavailableServices = MOCK_SERVICES.filter(
    (s) => s.status === 'locked' || s.status === 'coming_soon'
  )

  const handleUpgrade = () => onNavigate?.('subscription')
  const handleSupport = () => onNavigate?.('support')

  const openTickets = user?.openTickets ?? 0
  const supportValue = openTickets
    ? `${openTickets} ${openTickets !== 1 ? t('dashboard.supportOpenPlural') : t('dashboard.supportOpen')}`
    : t('dashboard.noOpenTickets')

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome')}, {user?.name ?? 'Usuario'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-0.5">{today}</p>
        </div>
      </div>

      {/* Summary cards */}
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          {t('dashboard.accountSummary')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={CreditCard}
            iconBg="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
            label={t('dashboard.planLabel')}
            value={user?.planLabel ?? t('common.free')}
            sub={t('dashboard.billingSub')}
            action={t('dashboard.billingAction')}
            onAction={() => onNavigate?.('subscription')}
          />
          <SummaryCard
            icon={Receipt}
            iconBg="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
            label={t('dashboard.billingLabel')}
            value={user?.billingStatus ?? t('dashboard.upToDate')}
            sub={
              user?.nextBillingDate
                ? `${t('dashboard.nextBilling')}: ${new Date(user.nextBillingDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES')}`
                : undefined
            }
            action={t('dashboard.invoicesAction')}
            onAction={() => onNavigate?.('subscription')}
          />
          <SummaryCard
            icon={Headphones}
            iconBg="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
            label={t('dashboard.supportLabel')}
            value={supportValue}
            sub={openTickets ? t('dashboard.supportAttention') : t('dashboard.supportOk')}
            action={t('dashboard.supportAction')}
            onAction={() => onNavigate?.('support')}
          />
          <SummaryCard
            icon={Gift}
            iconBg="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
            label={t('referrals.title')}
            value={`${MOCK_REFERRALS.stats.referred} ${t('referrals.referred')}`}
            sub={`$${MOCK_REFERRALS.stats.creditBalance} ${t('referrals.balance')}`}
            action={t('referrals.yourCode')}
            onAction={() => onNavigate?.('referrals')}
          />
        </div>
      </section>

      {/* Active services section */}
      <section aria-labelledby="my-services-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="my-services-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.myServices')}
          </h2>
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed border border-gray-200 dark:border-gray-700"
            aria-disabled="true"
            title={t('dashboard.comingSoon')}
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.addService')}
          </button>
        </div>

        {activeServices.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm">{t('dashboard.noActiveServices')}</p>
          </div>
        ) : (
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
        )}
      </section>

      {/* More services */}
      {unavailableServices.length > 0 && (
        <section aria-labelledby="more-services-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="more-services-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.moreServices')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('dashboard.moreServicesSub')}
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 focus:outline-none focus:underline"
            >
              {t('dashboard.seePlans')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

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
