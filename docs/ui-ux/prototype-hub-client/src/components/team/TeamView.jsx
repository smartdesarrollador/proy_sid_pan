import { useState } from 'react'
import { Users, UserPlus, Crown, Shield, User, X, Mail } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { MOCK_TEAM_MEMBERS } from '../../data/mockServices'

const PLAN_LIMIT = 5

const ROLE_CONFIG = {
  owner:  { color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300', Icon: Crown },
  admin:  { color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',         Icon: Shield },
  member: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',             Icon: User },
}

const STATUS_CONFIG = {
  active:    { color: 'badge-active', label: 'active' },
  suspended: { color: 'badge-inactive', label: 'suspended' },
  pending:   { color: 'badge-pending', label: 'pendingStatus' },
}

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

function InviteModal({ onClose, onInvite }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onInvite({ id: `inv-${Date.now()}`, email, role, status: 'pending', invitedAt: new Date().toISOString().slice(0, 10) })
    setSent(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('team.invite')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('team.inviteSent')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.inviteEmail')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="nuevo@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('team.inviteRole')}</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field w-full">
                  <option value="admin">{t('team.admin')}</option>
                  <option value="member">{t('team.member')}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  <UserPlus className="w-4 h-4" />
                  {t('team.invite')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamView() {
  const { t } = useTranslation()
  const [members, setMembers] = useState(MOCK_TEAM_MEMBERS)
  const [showInvite, setShowInvite] = useState(false)

  const activeMembers = members.filter((m) => m.status !== 'pending')
  const pendingInvites = members.filter((m) => m.status === 'pending')
  const limitReached = activeMembers.length >= PLAN_LIMIT

  const handleInvite = (invite) => setMembers((prev) => [...prev, invite])

  const handleRemove = (id) => setMembers((prev) => prev.filter((m) => m.id !== id))

  const handleSuspend = (id) =>
    setMembers((prev) =>
      prev.map((m) => m.id === id ? { ...m, status: m.status === 'suspended' ? 'active' : 'suspended' } : m)
    )

  const usagePct = Math.min((activeMembers.length / PLAN_LIMIT) * 100, 100)
  const barColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('team.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('team.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          disabled={limitReached}
          className={limitReached ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'}
          title={limitReached ? t('team.limitReached') : undefined}
        >
          <UserPlus className="w-4 h-4" />
          {t('team.invite')}
        </button>
      </div>

      {/* Usage bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activeMembers.length} / {PLAN_LIMIT} {t('team.usageBar')} Starter
            </span>
          </div>
          {limitReached && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t('team.limitReached')}</span>
          )}
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={usagePct} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usagePct}%` }} />
        </div>
      </div>

      {/* Members table */}
      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="text-base font-semibold text-gray-900 dark:text-white mb-3">{t('team.members')}</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {['', t('team.role'), t('team.status'), t('team.joined'), ''].map((col, i) => (
                    <th key={i} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {activeMembers.map((m) => {
                  const roleConf = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member
                  const RoleIcon = roleConf.Icon
                  const statusConf = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.active
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${roleConf.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {t(`team.${m.role}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={statusConf.color}>{t(`team.${statusConf.label}`)}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {m.joinedAt}
                      </td>
                      <td className="py-3 px-4">
                        {m.role !== 'owner' && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleSuspend(m.id)}
                              className="p-1.5 text-xs text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                              title={t('team.suspend')}
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemove(m.id)}
                              className="p-1.5 text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={t('team.remove')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <section aria-labelledby="pending-heading">
          <h2 id="pending-heading" className="text-base font-semibold text-gray-900 dark:text-white mb-3">{t('team.pending')}</h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{inv.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('team.invited')} {inv.invitedAt} · {t(`team.${inv.role}`)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(inv.id)}
                  className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {t('team.cancelInvite')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />
      )}
    </div>
  )
}
