import { useState } from 'react'
import { Copy, Check, Users, DollarSign, Wallet, Share2, UserPlus, Gift } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { MOCK_REFERRALS } from '../../data/mockServices'

function StatCard({ icon: Icon, iconBg, label, value, unit }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {unit && <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}

const HOW_IT_WORKS = [
  { Icon: Share2,   titleKey: 'step1Title', descKey: 'step1Desc', num: 1 },
  { Icon: UserPlus, titleKey: 'step2Title', descKey: 'step2Desc', num: 2 },
  { Icon: Gift,     titleKey: 'step3Title', descKey: 'step3Desc', num: 3 },
]

const STATUS_COLOR = {
  active:  'badge-active',
  pending: 'badge-pending',
}

export default function ReferralsView() {
  const { t } = useTranslation()
  const data = MOCK_REFERRALS
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(data.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(data.link).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('referrals.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('referrals.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
          label={t('referrals.referred')}
          value={data.stats.referred}
        />
        <StatCard
          icon={DollarSign}
          iconBg="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
          label={t('referrals.earned')}
          value={`$${data.stats.creditsEarned}`}
          unit={t('referrals.creditUnit')}
        />
        <StatCard
          icon={Wallet}
          iconBg="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
          label={t('referrals.balance')}
          value={`$${data.stats.creditBalance}`}
          unit={t('referrals.creditUnit')}
        />
      </div>

      {/* Referral code */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('referrals.yourCode')}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Code box */}
          <div className="flex items-center gap-3 flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <span className="font-mono text-lg font-bold text-primary-600 dark:text-primary-400 tracking-widest">
              {data.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={[
              'inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              copied
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                : 'btn-primary',
            ].join(' ')}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('referrals.copied') : t('referrals.copyCode')}
          </button>
        </div>

        {/* Share link */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('referrals.shareLink')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 truncate">
              {data.link}
            </div>
            <button
              onClick={handleCopyLink}
              className={[
                'p-2 rounded-lg transition-colors text-sm',
                copiedLink
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('referrals.howItWorks')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(({ Icon, titleKey, descKey, num }) => (
            <div key={num} className="flex flex-col items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {num}
                </div>
                <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(`referrals.${titleKey}`)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t(`referrals.${descKey}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-base font-semibold text-gray-900 dark:text-white mb-3">{t('referrals.history')}</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {[t('referrals.colEmail'), t('referrals.colPlan'), t('referrals.colStatus'), t('referrals.colCredit'), t('referrals.colDate')].map((col) => (
                    <th key={col} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.history.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-gray-700 dark:text-gray-300">{row.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{row.plan}</td>
                    <td className="py-3 px-4">
                      <span className={STATUS_COLOR[row.status] ?? 'badge-pending'}>
                        {t(`referrals.${row.status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {row.credit > 0 ? `$${row.credit}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
