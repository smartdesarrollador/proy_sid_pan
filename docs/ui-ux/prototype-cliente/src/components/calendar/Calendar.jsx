import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarViews } from './CalendarViews';
import { EventModal } from './EventModal';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { usePermissions } from '../../hooks/usePermissions';
import { events as initialEvents } from '../../data/mockData';

export const Calendar = () => {
  const [events, setEvents] = useState(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { canPerformAction, getUpgradeMessage } = useFeatureGate();
  const { canCreateEvents, canEditEvents, canDeleteEvents } = usePermissions();

  const handleCreateEvent = (date = null) => {
    // Verificar límite de eventos
    if (!canPerformAction('maxEvents', events.length)) {
      const message = getUpgradeMessage('maxEvents');
      alert(`${message.title}\n\n${message.message}`);
      return;
    }

    if (!canCreateEvents()) {
      alert('No tienes permisos para crear eventos');
      return;
    }

    setSelectedEvent(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    if (!canEditEvents()) {
      alert('No tienes permisos para editar eventos');
      return;
    }

    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (eventId) => {
    if (!canDeleteEvents()) {
      alert('No tienes permisos para eliminar eventos');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      setEvents(events.filter(e => e.id !== eventId));
    }
  };

  const handleSaveEvent = (eventData) => {
    if (selectedEvent) {
      // Editar
      setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, ...eventData } : e));
    } else {
      // Crear nuevo
      const newEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
        createdBy: 'user-001', // Mock current user
        createdAt: new Date().toISOString().split('T')[0]
      };
      setEvents([...events, newEvent]);
    }
    setIsModalOpen(false);
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateLabel = () => {
    const options = { year: 'numeric', month: 'long' };
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('es-ES', { ...options, day: 'numeric' });
    }
    return currentDate.toLocaleDateString('es-ES', options);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendario</h1>
        <p className="text-gray-600">Gestiona tus eventos y reuniones</p>
      </div>

      {/* Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleToday} className="btn btn-secondary">
              Hoy
            </button>

            <div className="flex items-center gap-1">
              <button onClick={handlePrevious} className="btn btn-ghost p-2">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNext} className="btn btn-ghost p-2">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              {getDateLabel()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-white shadow-sm' : ''}`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-white shadow-sm' : ''}`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded ${viewMode === 'day' ? 'bg-white shadow-sm' : ''}`}
              >
                Día
              </button>
            </div>

            <button onClick={() => handleCreateEvent()} className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      <CalendarViews
        viewMode={viewMode}
        currentDate={currentDate}
        events={events}
        onEventClick={handleEditEvent}
        onDateClick={handleCreateEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        preselectedDate={selectedDate}
      />
    </div>
  );
};
