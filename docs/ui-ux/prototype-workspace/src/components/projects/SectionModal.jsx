import { useState } from 'react';
import { X } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

export const SectionModal = ({ projectId, sectionsCount, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(null);

  const { canPerformAction, getUpgradeMessage } = useFeatureGate();

  const predefinedColors = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Morado', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Gris', value: '#6b7280' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    // Verificar feature gate
    if (!canPerformAction('maxSectionsPerProject', sectionsCount)) {
      const message = getUpgradeMessage('maxSectionsPerProject');
      setShowUpgradePrompt(message);
      return;
    }

    // Validación básica
    if (!formData.name.trim()) {
      alert('El nombre de la sección es obligatorio');
      return;
    }

    onSave(formData);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Sección</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Credenciales de Producción"
                className="input w-full"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la sección"
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Color
              </label>
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      formData.color === color.value
                        ? 'ring-2 ring-offset-2 ring-gray-400'
                        : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>

              {/* Custom color input */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-8 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">Color personalizado</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
              >
                Crear Sección
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <UpgradePrompt
          message={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(null)}
        />
      )}
    </>
  );
};
