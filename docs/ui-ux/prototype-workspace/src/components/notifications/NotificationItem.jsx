import { Clock, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '../../utils/dateUtils';

/**
 * Individual notification card for an event
 * @param {Object} props
 * @param {Object} props.event - Event object with timeInfo
 * @param {Function} props.onClick - Click handler
 */
function NotificationItem({ event, onClick }) {
  const { i18n } = useTranslation();
  const timeUntil = formatRelativeTime(
    event.timeInfo.totalMinutes,
    i18n.language
  );

  return (
    <div
      onClick={() => onClick(event.id)}
      className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors mb-2"
    >
      <div className="flex items-start gap-3">
        {/* Category color bar */}
        <div
          className="w-1 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.categoryColor }}
        />

        <div className="flex-1 min-w-0">
          {/* Event title */}
          <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {event.title}
          </h5>

          {/* Time: "14:30 - 15:30 • En 2 horas" */}
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mt-1">
            <Clock className="w-3 h-3" />
            <span>{event.startTime} - {event.endTime}</span>
            <span className="mx-1">•</span>
            <span className={event.timeInfo.isNow ? 'font-semibold text-primary-600' : ''}>
              {timeUntil}
            </span>
          </div>

          {/* Location (optional) */}
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Participants (optional) */}
          {event.participants && event.participants.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Users className="w-3 h-3" />
              <span>{event.participants.length} {i18n.language === 'es' ? 'participantes' : 'participants'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
