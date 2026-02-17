import { useState } from 'react';
import { X, Lock, Link, Mail, FileText, Key, Type } from 'lucide-react';

const ITEM_TYPES = [
  { value: 'credential', label: 'Credencial', icon: Lock, description: 'Usuario, contraseña y URL' },
  { value: 'link', label: 'Enlace', icon: Link, description: 'URL con descripción' },
  { value: 'note', label: 'Nota', icon: FileText, description: 'Texto libre' },
  { value: 'config', label: 'Configuración', icon: Type, description: 'Variables de entorno / config' },
  { value: 'api-key', label: 'API Key', icon: Key, description: 'Clave de API con descripción' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Cuenta de email con contraseña' },
];

export const ItemModal = ({ isOpen, onClose, onSave, sectionId }) => {
  const [step, setStep] = useState('type'); // 'type' | 'fields'
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  if (!isOpen) return null;

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep('fields');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave({
      sectionId,
      title: formData.title,
      description: formData.description,
      type: selectedType.value,
      isFavorite: false,
      expiresAt: null,
      createdBy: 'user-001',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    });
    // Reset
    setStep('type');
    setSelectedType(null);
    setFormData({ title: '', description: '' });
    onClose();
  };

  const handleBack = () => {
    setStep('type');
    setSelectedType(null);
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setFormData({ title: '', description: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step === 'type' ? 'Nuevo Item' : `Nuevo ${selectedType?.label}`}
            </h2>
            {step === 'fields' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedType?.description}</p>
            )}
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {step === 'type' ? (
          <div className="p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Selecciona el tipo de item que quieres crear:</p>
            <div className="grid grid-cols-2 gap-3">
              {ITEM_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeSelect(type)}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group text-left"
                  >
                    <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white text-center">{type.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del item *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                required
                autoFocus
                placeholder={`Ej: ${selectedType?.value === 'credential' ? 'Admin PostgreSQL' : selectedType?.value === 'link' ? 'Documentación React' : 'Mi nota'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                placeholder="Descripción opcional"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los campos específicos se agregarán después de crear el item.
            </p>
            <div className="flex gap-3 justify-between pt-2">
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                ← Volver
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={handleClose} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Item</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
