import { X, Bell, AlertCircle, Share2, MessageSquare, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { groupEventsByTime } from '../../utils/dateUtils';
import NotificationItem from './NotificationItem';

const ALERT_ICONS = {
  task: AlertCircle,
  shared: Share2,
  comment: MessageSquare,
  system: Clock,
};
const ALERT_COLORS = {
  task: 'text-orange-500',
  shared: 'text-blue-500',
  comment: 'text-green-500',
  system: 'text-gray-400',
};

function AlertItem({ alert }) {
  const Icon = ALERT_ICONS[alert.type] ?? AlertCircle;
  return (
    <div className={`p-3 rounded-lg mb-1 flex gap-3 ${!alert.read ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${ALERT_COLORS[alert.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
      </div>
      {!alert.read && (
        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

/**
 * Dropdown panel showing alerts and today's events grouped by time
 * @param {Object} props
 * @param {Array} props.events - Array of events for today
 * @param {Array} props.alerts - Array of alert notifications
 * @param {Function} props.onClose - Close dropdown callback
 * @param {Function} props.onEventClick - Event click callback
 * @param {Function} props.onMarkAlertsRead - Mark all alerts as read callback
 */
function NotificationDropdown({ events, alerts = [], onClose, onEventClick, onMarkAlertsRead }) {
  const { t } = useTranslation('notifications');
  const grouped = groupEventsByTime(events);
  const isEmpty = events.length === 0;
  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-[32rem] overflow-hidden flex flex-col z-50">
      {/* Header with title and close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {unreadAlerts > 0 && (
            <button
              onClick={onMarkAlertsRead}
              className="text-xs text-primary-600 hover:underline"
            >
              {t('alerts.markAllRead')}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1">
        {/* ── Alerts Section ── */}
        {alerts.length > 0 && (
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">
              {t('alerts.title')}
            </h4>
            {alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}

        {/* ── Today's Events Section ── */}
        {isEmpty ? (
          <div className="empty-state py-8">
            <Bell className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('empty')}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {alerts.length > 0 && (
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2 mt-1">
                {t('eventsTitle')}
              </h4>
            )}

            {/* Section "Now" */}
            {grouped.now.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">
                  {t('sections.now')}
                </h4>
                {grouped.now.map(event => (
                  <NotificationItem
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            )}

            {/* Section "Upcoming" */}
            {grouped.upcoming.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">
                  {t('sections.upcoming')}
                </h4>
                {grouped.upcoming.map(event => (
                  <NotificationItem
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            )}

            {/* Section "Later" */}
            {grouped.later.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 mb-2">
                  {t('sections.later')}
                </h4>
                {grouped.later.map(event => (
                  <NotificationItem
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with link to calendar */}
      {!isEmpty && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <button
            onClick={onClose}
            className="text-sm text-primary-600 hover:underline"
          >
            {t('viewCalendar')}
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
