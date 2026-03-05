import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DatePicker } from '../shared/DatePicker';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { users } from '../../data/mockData';

export const EventModal = ({ isOpen, onClose, onSave, event, preselectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    location: '',
    category: 'meeting',
    categoryColor: '#3b82f6',
    participants: [],
    isRecurring: false,
    recurrencePattern: 'none',
    reminders: []
  });

  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  const categories = [
    { id: 'meeting', label: 'Reunión', color: '#3b82f6' },
    { id: 'standup', label: 'Standup', color: '#10b981' },
    { id: 'client', label: 'Cliente', color: '#f59e0b' },
    { id: 'review', label: 'Revisión', color: '#8b5cf6' },
    { id: 'personal', label: 'Personal', color: '#ec4899' },
  ];

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate || '',
        startTime: event.startTime || '09:00',
        endDate: event.endDate || event.startDate || '',
        endTime: event.endTime || '10:00',
        location: event.location || '',
        category: event.category || 'meeting',
        categoryColor: event.categoryColor || '#3b82f6',
        participants: event.participants || [],
        isRecurring: event.isRecurring || false,
        recurrencePattern: event.recurrencePattern || 'none',
        reminders: event.reminders || []
      });
    } else {
      const defaultDate = preselectedDate || new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        startDate: defaultDate,
        startTime: '09:00',
        endDate: defaultDate,
        endTime: '10:00',
        location: '',
        category: 'meeting',
        categoryColor: '#3b82f6',
        participants: [],
        isRecurring: false,
        recurrencePattern: 'none',
        reminders: []
      });
    }
  }, [event, preselectedDate, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    // Validar que hora fin > hora inicio
    if (formData.startDate === formData.endDate) {
      const startMinutes = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1]);
      const endMinutes = parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1]);
      if (endMinutes <= startMinutes) {
        alert('La hora de fin debe ser posterior a la hora de inicio');
        return;
      }
    }

    // Validar feature gate para eventos recurrentes
    if (formData.isRecurring && formData.recurrencePattern !== 'none' && !hasFeature('recurringEvents')) {
      const message = getUpgradeMessage('recurringEvents');
      alert(`${message.title}\n\n${message.message}`);
      return;
    }

    onSave(formData);
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setFormData({
      ...formData,
      category: categoryId,
      categoryColor: category?.color || '#3b82f6'
    });
  };

  const handleRecurrenceChange = (pattern) => {
    if (pattern !== 'none' && !hasFeature('recurringEvents')) {
      const message = getUpgradeMessage('recurringEvents');
      alert(`${message.title}\n\n${message.message}`);
      return;
    }

    setFormData({
      ...formData,
      recurrencePattern: pattern,
      isRecurring: pattern !== 'none'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {event ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Ej: Sprint Planning Q1"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Describe los detalles del evento..."
            />
          </div>

          {/* Fecha y hora inicio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Fecha inicio"
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Hora inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          {/* Fecha y hora fin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Fecha fin"
              value={formData.endDate}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Hora fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              placeholder="Ej: Sala de Conferencias A, Zoom, Google Meet"
              list="location-suggestions"
            />
            <datalist id="location-suggestions">
              <option value="Sala de Conferencias A" />
              <option value="Sala de Conferencias B" />
              <option value="Zoom" />
              <option value="Google Meet" />
              <option value="Microsoft Teams" />
            </datalist>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Categoría
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.category === cat.id
                      ? 'border-current shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{
                    color: formData.category === cat.id ? cat.color : '#6b7280',
                    backgroundColor: formData.category === cat.id ? cat.color + '10' : 'transparent'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Participantes
            </label>
            <select
              multiple
              value={formData.participants}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, participants: selected });
              }}
              className="input"
              size={4}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} - {user.email}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples
            </p>
          </div>

          {/* Recurrencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Recurrencia
              {!hasFeature('recurringEvents') && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Plan Professional)</span>
              )}
            </label>
            <select
              value={formData.recurrencePattern}
              onChange={(e) => handleRecurrenceChange(e.target.value)}
              className="input"
            >
              <option value="none">No se repite</option>
              <option value="daily" disabled={!hasFeature('recurringEvents')}>
                Diariamente {!hasFeature('recurringEvents') && '(Bloqueado)'}
              </option>
              <option value="weekly" disabled={!hasFeature('recurringEvents')}>
                Semanalmente {!hasFeature('recurringEvents') && '(Bloqueado)'}
              </option>
              <option value="monthly" disabled={!hasFeature('recurringEvents')}>
                Mensualmente {!hasFeature('recurringEvents') && '(Bloqueado)'}
              </option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.title.trim()}
            >
              {event ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
