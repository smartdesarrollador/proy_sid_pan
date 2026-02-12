import { Calendar, MapPin, Users } from 'lucide-react';
import { events } from '../../../data/mockData';
import { EmptyState } from '../../shared/EmptyState';

export const CalendarWidget = ({ onNavigate }) => {
  // Obtener eventos desde hoy hacia adelante
  const today = new Date().toISOString().split('T')[0];

  const upcomingEvents = events
    .filter(e => e.startDate >= today)
    .sort((a, b) => {
      // Ordenar por fecha
      if (a.startDate !== b.startDate) {
        return new Date(a.startDate) - new Date(b.startDate);
      }
      // Si misma fecha, ordenar por hora
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 5); // Solo primeros 5

  const handleEventClick = (event) => {
    if (onNavigate) {
      onNavigate('calendar', event);
    } else {
      alert('Navegar a Calendar con evento seleccionado');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = dateStr;
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateOnly === todayStr) return 'Hoy';
    if (dateOnly === tomorrowStr) return 'Mañana';

    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Próximos Eventos</h3>
        <button
          onClick={() => onNavigate ? onNavigate('calendar') : alert('Navegar a Calendar')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver calendario
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin eventos próximos"
          description="No tienes eventos programados."
        />
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4"
              style={{ borderColor: event.categoryColor }}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm flex-1">
                  {event.title}
                </h4>
                <span
                  className="badge text-xs ml-2"
                  style={{ backgroundColor: event.categoryColor + '20', color: event.categoryColor }}
                >
                  {event.category}
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(event.startDate)} - {event.startTime}
                </div>

                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                )}

                {event.participants && event.participants.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.participants.length} participantes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
