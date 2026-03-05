import { useState } from 'react'
import { CreditCard, Plus, X, Star, Smartphone, Wallet, Check } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { MOCK_PAYMENT_METHODS } from '../../data/mockServices'

const BRAND_STYLES = {
  visa:        { bg: '#1A1F71', text: '#fff', label: 'VISA' },
  mastercard:  { bg: 'linear-gradient(135deg,#eb6400,#c8001d)', text: '#fff', label: 'MC' },
  paypal:      { bg: '#003087', text: '#fff', label: 'PP' },
  mercadopago: { bg: '#009EE3', text: '#fff', label: 'MP' },
  yape:        { bg: '#5B2D90', text: '#fff', label: 'YP' },
  plin:        { bg: '#00B0EA', text: '#fff', label: 'PL' },
  nequi:       { bg: '#6F2B8B', text: '#fff', label: 'NQ' },
  daviplata:   { bg: '#E5002B', text: '#fff', label: 'DV' },
}

function BrandBadge({ brand, size = 'md' }) {
  const style = BRAND_STYLES[brand] ?? { bg: '#6b7280', text: '#fff', label: brand?.toUpperCase().slice(0, 2) }
  const dim = size === 'sm' ? 'w-8 h-5 text-[9px]' : 'w-12 h-8 text-xs'
  return (
    <div
      className={`${dim} rounded flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </div>
  )
}

function MethodCard({ method, onSetDefault, onRemove }) {
  const { t } = useTranslation()
  const isCard = method.type === 'card'
  const isWallet = ['paypal', 'mercadopago'].includes(method.type)
  const isLocal = ['yape', 'plin', 'nequi', 'daviplata'].includes(method.type)

  const subtitle = isCard
    ? `•••• ${method.last4}  ${method.expMonth}/${method.expYear}`
    : isWallet || isLocal
    ? method.email ?? method.phone
    : ''

  return (
    <div className={`card p-4 flex items-center gap-4 ${method.isDefault ? 'ring-2 ring-primary-500' : ''}`}>
      <BrandBadge brand={method.brand ?? method.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {t(`billing.${method.brand ?? method.type}`) || (method.brand ?? method.type)}
          </span>
          {method.isDefault && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded">
              <Star className="w-3 h-3" />
              {t('billing.defaultBadge')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            title={t('billing.setDefault')}
            className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(method.id)}
          title={t('billing.remove')}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          disabled={method.isDefault}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const TABS = ['card', 'wallet', 'local']
const TAB_ICONS = { card: CreditCard, wallet: Wallet, local: Smartphone }

function AddPaymentModal({ onClose, onAdd }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('card')
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', holder: '' })
  const [walletConnected, setWalletConnected] = useState({})
  const [localPhone, setLocalPhone] = useState({})

  const handleCardSubmit = (e) => {
    e.preventDefault()
    onAdd({ id: `pm-${Date.now()}`, type: 'card', brand: 'visa', last4: cardForm.number.slice(-4) || '0000', expMonth: 12, expYear: 2028, isDefault: false })
    onClose()
  }

  const handleWalletConnect = (type) => {
    setWalletConnected((p) => ({ ...p, [type]: true }))
    setTimeout(() => {
      onAdd({ id: `pm-${Date.now()}`, type, email: 'nueva@cuenta.com', isDefault: false })
      onClose()
    }, 600)
  }

  const handleLocalSubmit = (type) => {
    onAdd({ id: `pm-${Date.now()}`, type, phone: localPhone[type] || '+51 000 000 000', isDefault: false })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('billing.addMethod')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab]
            const labels = { card: t('billing.card'), wallet: t('billing.digitalWallet'), local: t('billing.localPayment') }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2',
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
              >
                <Icon className="w-3.5 h-3.5" />
                {labels[tab]}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {activeTab === 'card' && (
            <form onSubmit={handleCardSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('billing.cardNumber')}</label>
                <input type="text" placeholder="1234 5678 9012 3456" maxLength={19}
                  value={cardForm.number} onChange={(e) => setCardForm((p) => ({ ...p, number: e.target.value }))}
                  className="input-field w-full" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('billing.expiry')}</label>
                  <input type="text" placeholder="MM/AA" maxLength={5}
                    value={cardForm.expiry} onChange={(e) => setCardForm((p) => ({ ...p, expiry: e.target.value }))}
                    className="input-field w-full" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('billing.cvv')}</label>
                  <input type="text" placeholder="CVV" maxLength={4}
                    value={cardForm.cvv} onChange={(e) => setCardForm((p) => ({ ...p, cvv: e.target.value }))}
                    className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('billing.cardHolder')}</label>
                <input type="text" placeholder="Nombre completo"
                  value={cardForm.holder} onChange={(e) => setCardForm((p) => ({ ...p, holder: e.target.value }))}
                  className="input-field w-full" />
              </div>
              <button type="submit" className="btn-primary w-full justify-center mt-2">
                <Plus className="w-4 h-4" />
                {t('billing.addMethod')}
              </button>
            </form>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-3">
              {['paypal', 'mercadopago'].map((type) => (
                <button key={type} onClick={() => handleWalletConnect(type)}
                  className={[
                    'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all',
                    walletConnected[type]
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <BrandBadge brand={type} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t(`billing.${type}`)}</span>
                  </div>
                  {walletConnected[type] ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <Check className="w-3.5 h-3.5" /> {t('billing.connected')}
                    </span>
                  ) : (
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{t('billing.connect')}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-4">
              {['yape', 'plin', 'nequi', 'daviplata'].map((type) => (
                <div key={type} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <BrandBadge brand={type} size="sm" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{t(`billing.${type}`)}</p>
                    <input type="tel" placeholder="+51 999 000 000"
                      value={localPhone[type] ?? ''}
                      onChange={(e) => setLocalPhone((p) => ({ ...p, [type]: e.target.value }))}
                      className="input-field w-full text-xs py-1.5" />
                  </div>
                  <button onClick={() => handleLocalSubmit(type)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    {t('billing.connect')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentMethodsView() {
  const { t } = useTranslation()
  const [methods, setMethods] = useState(MOCK_PAYMENT_METHODS)
  const [showModal, setShowModal] = useState(false)

  const handleSetDefault = (id) =>
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })))

  const handleRemove = (id) =>
    setMethods((prev) => prev.filter((m) => m.id !== id))

  const handleAdd = (method) =>
    setMethods((prev) => [...prev, method])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('billing.subtitle')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('billing.addMethod')}
        </button>
      </div>

      {methods.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 dark:text-gray-500">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('billing.noMethods')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              onSetDefault={handleSetDefault}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddPaymentModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
