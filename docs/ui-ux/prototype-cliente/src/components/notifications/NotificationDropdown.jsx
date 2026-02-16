import { X, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { groupEventsByTime } from '../../utils/dateUtils';
import NotificationItem from './NotificationItem';

/**
 * Dropdown panel showing today's events grouped by time
 * @param {Object} props
 * @param {Array} props.events - Array of events for today
 * @param {Function} props.onClose - Close dropdown callback
 * @param {Function} props.onEventClick - Event click callback
 */
function NotificationDropdown({ events, onClose, onEventClick }) {
  const { t } = useTranslation('notifications');
  const grouped = groupEventsByTime(events);
  const isEmpty = events.length === 0;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-[32rem] overflow-hidden flex flex-col z-50">
      {/* Header with title and close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1">
        {isEmpty ? (
          // Empty state
          <div className="empty-state py-8">
            <Calendar className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('empty')}
            </p>
          </div>
        ) : (
          <div className="p-2">
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
