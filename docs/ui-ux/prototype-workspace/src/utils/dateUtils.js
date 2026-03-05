/**
 * Date and Time Utilities for Event Notifications
 * Provides helpers for filtering events, calculating relative time, and grouping
 */

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Filter events occurring today
 * @param {Array} events - Array of event objects
 * @returns {Array} Events scheduled for today
 */
export const getTodayEvents = (events) => {
  const today = getTodayDate();
  return events.filter(event => event.startDate === today);
};

/**
 * Calculate time until event in minutes
 * @param {string} eventDate - Event date (YYYY-MM-DD)
 * @param {string} eventTime - Event time (HH:MM)
 * @returns {Object} Time information
 */
export const getTimeUntilEvent = (eventDate, eventTime) => {
  const now = new Date();
  const [hours, minutes] = eventTime.split(':');
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

  const diffMs = eventDateTime - now;
  const diffMins = Math.floor(diffMs / 60000);

  return {
    totalMinutes: diffMins,
    hours: Math.floor(diffMins / 60),
    minutes: diffMins % 60,
    isPast: diffMins < 0,
    isNow: diffMins >= -15 && diffMins <= 15 // ±15 min window
  };
};

/**
 * Format time relative to now
 * @param {number} minutes - Minutes until event (negative if past)
 * @param {string} language - Language code ('es' or 'en')
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (minutes, language = 'es') => {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  if (language === 'es') {
    if (minutes < -15) return 'Pasado';
    if (minutes >= -15 && minutes <= 15) return 'Ahora';
    if (hours === 0) return `En ${mins} minuto${mins !== 1 ? 's' : ''}`;
    if (mins === 0) return `En ${hours} hora${hours !== 1 ? 's' : ''}`;
    return `En ${hours}h ${mins}m`;
  } else {
    if (minutes < -15) return 'Past';
    if (minutes >= -15 && minutes <= 15) return 'Now';
    if (hours === 0) return `In ${mins} minute${mins !== 1 ? 's' : ''}`;
    if (mins === 0) return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    return `In ${hours}h ${mins}m`;
  }
};

/**
 * Group events by time category
 * @param {Array} events - Array of events for today
 * @returns {Object} Events grouped by 'now', 'upcoming', 'later'
 */
export const groupEventsByTime = (events) => {
  const grouped = { now: [], upcoming: [], later: [] };

  events.forEach(event => {
    const timeInfo = getTimeUntilEvent(event.startDate, event.startTime);

    if (timeInfo.isNow) {
      grouped.now.push({ ...event, timeInfo });
    } else if (timeInfo.totalMinutes > 0 && timeInfo.totalMinutes <= 120) {
      grouped.upcoming.push({ ...event, timeInfo });
    } else if (timeInfo.totalMinutes > 120) {
      grouped.later.push({ ...event, timeInfo });
    }
  });

  return grouped;
};
