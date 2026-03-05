import { Check, ArrowRight, Zap, Globe, Layout, Monitor } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

export default function LandingPage({ onLogin }) {
  const { t } = useTranslation()

  const FEATURE_HIGHLIGHTS = [
    {
      icon: Layout,
      color: '#6366f1',
      name: 'Workspace',
      description: t('landing.workspaceDesc'),
    },
    {
      icon: Globe,
      color: '#0ea5e9',
      name: 'Vista Digital',
      description: t('landing.vistaDesc'),
    },
    {
      icon: Monitor,
      color: '#8b5cf6',
      name: 'Desktop App',
      description: t('landing.desktopDesc'),
    },
  ]

  const PLANS = [
    {
      name: 'Free',
      price: '$0',
      period: t('subscription.perMonth'),
      description: t('landing.freePlanDesc'),
      color: 'border-gray-200 dark:border-gray-700',
      headerBg: 'bg-gray-50 dark:bg-gray-800',
      features: [
        { label: t('landing.feat1'), included: true },
        { label: t('landing.feat2'), included: false },
        { label: t('landing.feat3'), included: true },
        { label: t('landing.feat4'), included: true },
        { label: t('landing.feat5'), included: false },
        { label: t('landing.feat6'), included: false },
      ],
      cta: t('landing.freeCta'),
      ctaStyle: 'btn-secondary',
      popular: false,
    },
    {
      name: 'Starter',
      price: '$29',
      period: t('subscription.perMonth'),
      description: t('landing.starterPlanDesc'),
      color: 'border-primary-200 dark:border-primary-700',
      headerBg: 'bg-primary-50 dark:bg-primary-900/30',
      features: [
        { label: t('landing.feat7'), included: true },
        { label: t('landing.feat2'), included: true },
        { label: t('landing.feat8'), included: true },
        { label: t('landing.feat9'), included: true },
        { label: t('landing.feat5'), included: false },
        { label: t('landing.feat6'), included: false },
      ],
      cta: t('landing.starterCta'),
      ctaStyle: 'btn-primary',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$79',
      period: t('subscription.perMonth'),
      description: t('landing.proPlanDesc'),
      color: 'border-indigo-300 dark:border-indigo-600',
      headerBg: 'bg-indigo-600',
      features: [
        { label: t('landing.feat7'), included: true },
        { label: t('landing.feat2'), included: true },
        { label: t('landing.feat10'), included: true },
        { label: t('landing.feat11'), included: true },
        { label: t('landing.feat5'), included: true },
        { label: t('landing.feat6'), included: true },
      ],
      cta: t('landing.proCta'),
      ctaStyle: 'btn-primary',
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{t('login.title')}</span>
          </div>
          <button
            onClick={onLogin}
            className="btn-primary"
          >
            {t('landing.ctaLogin')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
            {t('landing.badge')}
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            {t('landing.title')}
            <br />
            <span className="text-primary-600 dark:text-primary-400">{t('landing.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onLogin} className="btn-primary text-base px-6 py-3">
              {t('landing.ctaLogin')}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#pricing"
              className="btn-secondary text-base px-6 py-3 justify-center"
            >
              {t('landing.ctaPlans')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              {t('landing.featuresSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURE_HIGHLIGHTS.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.name}
                  className="card p-6 hover:shadow-md transition-shadow group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-20 px-4 bg-gray-50 dark:bg-gray-800"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 id="pricing-heading" className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.pricingTitle')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{t('landing.pricingSub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${plan.color} overflow-hidden shadow-sm ${plan.popular ? 'shadow-lg scale-105' : ''} relative`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      {t('landing.mostPopular')}
                    </span>
                  </div>
                )}

                <div className={`${plan.popular ? 'bg-indigo-600' : plan.headerBg} px-6 py-8`}>
                  <h3
                    className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${plan.popular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${plan.popular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <ul className="space-y-3 mb-8" role="list">
                    {plan.features.map((feature) => (
                      <li key={feature.label} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <span className="w-4 h-4 flex-shrink-0 text-gray-300 dark:text-gray-600 font-bold text-center">
                            -
                          </span>
                        )}
                        <span
                          className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}
                        >
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={onLogin}
                    className={plan.ctaStyle + ' w-full justify-center'}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">{t('login.title')}</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} RBAC Platform. {t('landing.footerRights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
