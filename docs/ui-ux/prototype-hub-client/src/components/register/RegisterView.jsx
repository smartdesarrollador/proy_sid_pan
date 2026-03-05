import { useState } from 'react'
import { Check, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { MOCK_USER } from '../../data/mockServices'

const REGISTER_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mes',
    features: ['Workspace (acceso limitado)', '1 usuario', 'Soporte por email'],
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/mes',
    features: ['Workspace completo', 'Vista Digital', 'Hasta 5 usuarios', 'Soporte prioritario'],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$79',
    period: '/mes',
    features: ['Todo de Starter', 'Hasta 20 usuarios', 'Analytics Pro', 'Desktop App', 'Soporte 24/7'],
    popular: true,
  },
]

const STEPS = ['step1', 'step2', 'step3', 'step4']

function Stepper({ currentStep, t }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isDone = stepNum < currentStep
        const isActive = stepNum === currentStep
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={[
                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300',
                isDone  ? 'bg-primary-600 text-white' :
                isActive ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40' :
                           'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
              ].join(' ')}>
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {t(`register.${step}`)}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-5 transition-colors duration-300 ${stepNum < currentStep ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RegisterView({ onGoToLanding }) {
  const { login } = useAuth()
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', password: '', confirm: '', orgName: '', plan: 'starter' })
  const [creating, setCreating] = useState(false)

  const subdomain = form.orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'mi-empresa'

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  const handleFinish = async () => {
    setCreating(true)
    await new Promise((r) => setTimeout(r, 1000))
    setCreating(false)
    next() // step 4 — success
  }

  const handleGoToDashboard = async () => {
    await login(form.email || MOCK_USER.email, 'demo')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top bar */}
      <nav className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
        <button onClick={onGoToLanding} className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-1">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">{t('login.title')}</span>
        </button>
      </nav>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {step < 4 && <Stepper currentStep={step} t={t} />}

          {/* Step 1 — Account */}
          {step === 1 && (
            <div className="card p-8 space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('register.step1')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea tus credenciales de acceso</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.email')}</label>
                  <input type="email" required value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="input-field w-full" placeholder="tu@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.password')}</label>
                  <input type="password" required value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="input-field w-full" placeholder="Min. 8 caracteres" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.confirmPassword')}</label>
                  <input type="password" required value={form.confirm}
                    onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                    className="input-field w-full" placeholder="Repite tu contrasena" />
                </div>
              </div>
              <button onClick={next} className="btn-primary w-full justify-center">
                {t('register.next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Company */}
          {step === 2 && (
            <div className="card p-8 space-y-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('register.step2')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Datos de tu organizacion</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.orgName')}</label>
                  <input type="text" required value={form.orgName}
                    onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))}
                    className="input-field w-full" placeholder="Empresa XYZ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.subdomainPreview')}</label>
                  <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">{subdomain}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-sm">.rbacplatform.com</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="btn-secondary flex-1 justify-center">{t('register.back')}</button>
                <button onClick={next} className="btn-primary flex-1 justify-center">
                  {t('register.next')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Plan */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('register.selectPlan')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('register.freeTrial')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {REGISTER_PLANS.map((plan) => {
                  const selected = form.plan === plan.id
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setForm((p) => ({ ...p, plan: plan.id }))}
                      className={[
                        'relative rounded-xl border-2 p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500',
                        selected
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600',
                      ].join(' ')}
                    >
                      {plan.popular && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                          {t('landing.mostPopular')}
                        </span>
                      )}
                      {selected && (
                        <div className="absolute top-3 left-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mt-5">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{plan.period}</span>
                      </div>
                      <ul className="space-y-1.5 mt-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="btn-secondary flex-1 justify-center">{t('register.back')}</button>
                <button onClick={handleFinish} disabled={creating} className="btn-primary flex-1 justify-center">
                  {creating ? t('register.creating') : t('register.createAccount')}
                  {!creating && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Success */}
          {step === 4 && (
            <div className="card p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register.accountReady')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">{t('register.accountReadySub')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.email')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.email || MOCK_USER.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.orgName')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.orgName || 'Mi Empresa'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Plan</span>
                  <span className="font-medium text-primary-600 dark:text-primary-400 capitalize">{form.plan}</span>
                </div>
              </div>
              <button onClick={handleGoToDashboard} className="btn-primary w-full justify-center text-base py-3">
                {t('register.goToDashboard')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
