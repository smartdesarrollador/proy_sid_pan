import { Check, X, Download, Star, Zap, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { PLANS, MOCK_INVOICES } from '../../data/mockServices'

function UsageMeter({ label, current, total, unit = '' }) {
  const { t } = useTranslation()
  const isUnlimited = total === null
  const pct = isUnlimited ? 0 : Math.min((current / total) * 100, 100)

  let barColor = 'bg-green-500'
  if (pct >= 90) barColor = 'bg-red-500'
  else if (pct >= 70) barColor = 'bg-yellow-500'
  if (isUnlimited) barColor = 'bg-primary-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isUnlimited ? t('subscription.unlimited') : `${current}${unit} / ${total}${unit}`}
        </span>
      </div>
      <div
        className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={isUnlimited ? 100 : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

function InvoiceRow({ invoice }) {
  const { t } = useTranslation()
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</td>
      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{invoice.period}</td>
      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">{invoice.amount}</td>
      <td className="py-3 px-4">
        <span className="badge-active">{t('subscription.paid')}</span>
      </td>
      <td className="py-3 px-4">
        <a
          href={invoice.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
          aria-label={`${t('subscription.downloadLabel')} ${invoice.id}`}
        >
          <Download className="w-4 h-4" />
          {t('subscription.download')}
        </a>
      </td>
    </tr>
  )
}

export default function SubscriptionView() {
  const { user } = useAuth()
  const { t, lang } = useTranslation()
  const [billingCycle, setBillingCycle] = useState('monthly')

  const currentPlan = user?.plan ?? 'starter'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('subscription.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('subscription.subtitle')}</p>
      </div>

      {/* Current plan card */}
      <section aria-labelledby="current-plan-heading">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-1">
                  {t('subscription.currentPlan')}
                </p>
                <h2 id="current-plan-heading" className="text-2xl font-bold text-white">
                  {user?.planLabel ?? 'Starter'}
                </h2>
                <p className="text-primary-200 text-sm mt-1">
                  {t('subscription.renewsOn')}{' '}
                  {new Date(user?.nextBillingDate ?? '2026-04-01').toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-white">$29</p>
                <p className="text-primary-200 text-sm">{t('subscription.perMonth')}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('subscription.planUsage')}</h3>
            <UsageMeter label={t('subscription.users')} current={1} total={5} />
            <UsageMeter label={t('subscription.storage')} current={2.1} total={10} unit=" GB" />
            <UsageMeter label={t('subscription.activeServices')} current={2} total={3} />
          </div>
        </div>
      </section>

      {/* Billing cycle toggle */}
      <section aria-labelledby="plans-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 id="plans-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('subscription.comparePlans')}
          </h2>
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={billingCycle === 'monthly'}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              ].join(' ')}
            >
              {t('subscription.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              aria-pressed={billingCycle === 'annual'}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center gap-1.5',
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              ].join(' ')}
            >
              {t('subscription.annual')}
              <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded">
                -10%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const annualPrice = plan.price === '$0' ? '$0' : `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.9)}`
            const displayPrice = billingCycle === 'annual' && plan.price !== '$0' ? annualPrice : plan.price

            return (
              <div
                key={plan.id}
                className={[
                  'rounded-xl border-2 overflow-hidden',
                  isCurrent
                    ? 'border-primary-500 shadow-md'
                    : plan.popular
                    ? 'border-indigo-300 dark:border-indigo-600'
                    : 'border-gray-200 dark:border-gray-700',
                ].join(' ')}
              >
                <div
                  className={[
                    'px-5 py-5',
                    isCurrent ? 'bg-primary-600' : plan.popular ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-800',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className={`font-bold text-lg ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`text-xs mt-0.5 ${
                          isCurrent ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {plan.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                          <Star className="w-3 h-3 mr-1" />
                          {t('subscription.actual')}
                        </span>
                      )}
                      {plan.popular && !isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {t('subscription.popular')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mt-3">
                    <span
                      className={`text-3xl font-extrabold ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                    >
                      {displayPrice}
                    </span>
                    <span
                      className={`text-sm ${isCurrent ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-5 bg-white dark:bg-gray-900">
                  <ul className="space-y-2.5 mb-5" role="list">
                    {plan.features.map((feat) => (
                      <li key={feat.label} className="flex items-center gap-2.5">
                        {feat.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${feat.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}
                        >
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full justify-center inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                      aria-disabled="true"
                    >
                      {t('subscription.currentPlanBtn')}
                    </button>
                  ) : plan.id === 'free' ? (
                    <button
                      disabled
                      className="w-full justify-center inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                      aria-disabled="true"
                    >
                      {t('subscription.lowerPlan')}
                    </button>
                  ) : (
                    <button
                      className="btn-primary w-full justify-center"
                      aria-label={`Actualizar al plan ${plan.name}`}
                    >
                      <Zap className="w-4 h-4" />
                      {plan.cta}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Invoice history */}
      <section aria-labelledby="invoices-heading">
        <h2 id="invoices-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('subscription.invoices')}
        </h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {[
                    t('subscription.colInvoice'),
                    t('subscription.colPeriod'),
                    t('subscription.colAmount'),
                    t('subscription.colStatus'),
                    t('subscription.colAction'),
                  ].map((col) => (
                    <th
                      key={col}
                      className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {MOCK_INVOICES.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
