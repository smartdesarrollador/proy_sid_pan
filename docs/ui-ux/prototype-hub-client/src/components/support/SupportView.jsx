import { useState } from 'react'
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Inbox,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
} from 'lucide-react'
import { MOCK_TICKETS } from '../../data/mockServices'
import { useTranslation } from '../../contexts/LanguageContext'

function TicketRow({ ticket }) {
  const { t, lang } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const STATUS_CONFIG = {
    open: { label: t('support.statusOpen'), className: 'badge-active', icon: Inbox },
    in_progress: { label: t('support.statusInProgress'), className: 'badge-soon', icon: Clock },
    resolved: { label: t('support.statusResolved'), className: 'badge-inactive', icon: CheckCircle },
  }

  const PRIORITY_CONFIG = {
    urgente: { label: t('support.priorityUrgente'), className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    alta: { label: t('support.priorityAlta'), className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    media: { label: t('support.priorityMedia'), className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    baja: { label: t('support.priorityBaja'), className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  }

  const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open
  const priority = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.media
  const StatusIcon = status.icon
  const date = new Date(ticket.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES')

  return (
    <li className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div
        className="flex items-start gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded((v) => !v)
          }
        }}
        aria-expanded={expanded}
        aria-label={`Ticket ${ticket.id}: ${ticket.title}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1.5">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap">{ticket.id}</span>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-snug truncate">
              {ticket.title}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${status.className} gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priority.className}`}
            >
              {priority.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="pl-0 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{ticket.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('support.openedOn')} {date}</span>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

function NewTicketModal({ onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ title: '', description: '', priority: 'media' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(onClose, 1500)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 id="new-ticket-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('support.modalTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              aria-label={t('support.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white">{t('support.successTitle')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('support.successSub')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
              <div>
                <label htmlFor="ticket-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('support.titleField')}
                </label>
                <input
                  id="ticket-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t('support.titlePlaceholder')}
                  className="input-base"
                />
              </div>

              <div>
                <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('support.descField')}
                </label>
                <textarea
                  id="ticket-description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t('support.descPlaceholder')}
                  className="input-base resize-none"
                />
              </div>

              <div>
                <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('support.priorityField')}
                </label>
                <select
                  id="ticket-priority"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="input-base"
                  aria-label={t('support.priorityField')}
                >
                  <option value="baja">{t('support.priorityBaja')}</option>
                  <option value="media">{t('support.priorityMedia')}</option>
                  <option value="alta">{t('support.priorityAlta')}</option>
                  <option value="urgente">{t('support.priorityUrgente')}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1 justify-center"
                >
                  {t('support.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title || !form.description}
                  className="btn-primary flex-1 justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('support.submitting')}
                    </>
                  ) : (
                    t('support.submit')
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default function SupportView() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const openCount = MOCK_TICKETS.filter((t) => t.status === 'open').length
  const inProgressCount = MOCK_TICKETS.filter((t) => t.status === 'in_progress').length
  const resolvedCount = MOCK_TICKETS.filter((t) => t.status === 'resolved').length

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('support.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('support.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            {t('support.newTicket')}
          </button>
        </div>

        {/* KPI cards */}
        <section aria-label={t('support.stats')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('support.open')}
              </p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{openCount}</p>
            </div>
            <div className="card px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('support.inProgress')}
              </p>
              <p className="text-3xl font-extrabold text-yellow-500 dark:text-yellow-400">{inProgressCount}</p>
            </div>
            <div className="card px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('support.resolved')}
              </p>
              <p className="text-3xl font-extrabold text-gray-400 dark:text-gray-500">{resolvedCount}</p>
            </div>
          </div>
        </section>

        {/* Ticket list */}
        <section aria-labelledby="tickets-heading">
          <h2 id="tickets-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('support.myTickets')}
          </h2>
          <div className="card overflow-hidden">
            <ul role="list" aria-label={t('support.ticketList')}>
              {MOCK_TICKETS.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </ul>
          </div>
        </section>

        {/* Help banner */}
        <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-primary-900 dark:text-primary-300 text-sm">
              {t('support.helpTitle')}
            </p>
            <p className="text-primary-700 dark:text-primary-400 text-xs mt-0.5">
              {t('support.helpSub')}{' '}
              <a
                href="mailto:soporte@rbacplatform.com"
                className="underline hover:text-primary-900 dark:hover:text-primary-200 focus:outline-none focus:text-primary-900"
              >
                soporte@rbacplatform.com
              </a>
            </p>
          </div>
          <AlertCircle className="w-6 h-6 text-primary-500 flex-shrink-0" />
        </div>
      </div>

      {showModal && <NewTicketModal onClose={() => setShowModal(false)} />}
    </>
  )
}
