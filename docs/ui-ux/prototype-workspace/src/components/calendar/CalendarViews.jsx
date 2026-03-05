import { EventCard } from './EventCard';

export const CalendarViews = ({ viewMode, currentDate, events, onEventClick, onDateClick, onDeleteEvent }) => {
  if (viewMode === 'month') {
    return <MonthView currentDate={currentDate} events={events} onEventClick={onEventClick} onDateClick={onDateClick} />;
  } else if (viewMode === 'week') {
    return <WeekView currentDate={currentDate} events={events} onEventClick={onEventClick} onDeleteEvent={onDeleteEvent} />;
  } else {
    return <DayView currentDate={currentDate} events={events} onEventClick={onEventClick} onDeleteEvent={onDeleteEvent} />;
  }
};

// Vista Mensual
const MonthView = ({ currentDate, events, onEventClick, onDateClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Obtener primer día del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Obtener día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  const startDayOfWeek = firstDay.getDay();

  // Días del mes anterior para rellenar
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  // Días del mes actual
  const daysInMonth = lastDay.getDate();
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Días del mes siguiente para completar semanas
  const totalDays = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDays = totalDays % 7 === 0 ? [] : Array.from({ length: 7 - (totalDays % 7) }, (_, i) => i + 1);

  const allDays = [
    ...prevMonthDays.map(d => ({ day: d, isCurrentMonth: false, isPrev: true })),
    ...currentMonthDays.map(d => ({ day: d, isCurrentMonth: true })),
    ...nextMonthDays.map(d => ({ day: d, isCurrentMonth: false, isPrev: false }))
  ];

  const getEventsForDate = (day, isCurrentMonth, isPrev) => {
    let dateToCheck;
    if (isCurrentMonth) {
      dateToCheck = new Date(year, month, day);
    } else if (isPrev) {
      dateToCheck = new Date(year, month - 1, day);
    } else {
      dateToCheck = new Date(year, month + 1, day);
    }

    const dateStr = dateToCheck.toISOString().split('T')[0];
    return events.filter(e => e.startDate === dateStr);
  };

  const isToday = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return false;
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div className="card overflow-hidden">
      {/* Días de la semana */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {allDays.map((dayObj, index) => {
          const dayEvents = getEventsForDate(dayObj.day, dayObj.isCurrentMonth, dayObj.isPrev);
          const isTodayDate = isToday(dayObj.day, dayObj.isCurrentMonth);

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                !dayObj.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-700' : ''
              }`}
              onClick={() => {
                if (dayObj.isCurrentMonth) {
                  const clickedDate = new Date(year, month, dayObj.day).toISOString().split('T')[0];
                  onDateClick(clickedDate);
                }
              }}
            >
              <div className={`text-sm font-medium mb-1 ${
                !dayObj.isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : isTodayDate ? 'text-primary-600 font-bold' : 'text-gray-900 dark:text-white'
              }`}>
                {isTodayDate && (
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-xs">
                    {dayObj.day}
                  </span>
                )}
                {!isTodayDate && dayObj.day}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.categoryColor + '20', color: event.categoryColor }}
                  >
                    {event.startTime} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Vista Semanal
const WeekView = ({ currentDate, events, onEventClick, onDeleteEvent }) => {
  // Obtener inicio de la semana (domingo)
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);

  // Generar 7 días
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm

  const getEventsForDateTime = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      if (e.startDate !== dateStr) return false;
      const eventHour = parseInt(e.startTime.split(':')[0]);
      return eventHour === hour;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="card overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header con días */}
        <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 sticky top-0">
          <div className="p-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
            Hora
          </div>
          {weekDays.map((date, index) => (
            <div key={index} className={`p-2 text-center border-r border-gray-200 dark:border-gray-700 ${isToday(date) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][index]}
              </div>
              <div className={`text-sm font-semibold ${isToday(date) ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horas */}
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 text-sm text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
              {hour}:00
            </div>
            {weekDays.map((date, index) => {
              const hourEvents = getEventsForDateTime(date, hour);
              return (
                <div key={index} className="min-h-[60px] p-1 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {hourEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={onEventClick}
                      onDelete={onDeleteEvent}
                      compact
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Vista Diaria
const DayView = ({ currentDate, events, onEventClick, onDeleteEvent }) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm
  const dateStr = currentDate.toISOString().split('T')[0];

  const getEventsForHour = (hour) => {
    return events.filter(e => {
      if (e.startDate !== dateStr) return false;
      const eventHour = parseInt(e.startTime.split(':')[0]);
      return eventHour === hour;
    });
  };

  return (
    <div className="card">
      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
      </div>

      <div>
        {hours.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className="flex border-b border-gray-200 dark:border-gray-700">
              <div className="w-24 p-3 text-sm text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                {hour}:00
              </div>
              <div className="flex-1 min-h-[80px] p-3 space-y-2">
                {hourEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={onEventClick}
                    onDelete={onDeleteEvent}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
