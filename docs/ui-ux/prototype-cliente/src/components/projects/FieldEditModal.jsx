import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

export const FieldEditModal = ({ isOpen, onClose, onSave, field }) => {
  const [value, setValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (field) {
      // Don't pre-fill password fields for security
      setValue(field.fieldType === 'password' ? '' : field.fieldValue || '');
      setShowPassword(false);
    }
  }, [field, isOpen]);

  if (!isOpen || !field) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...field, fieldValue: value || field.fieldValue });
    onClose();
  };

  const renderInput = () => {
    switch (field.fieldType) {
      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="input w-full pr-10 font-mono"
              placeholder="Ingresa nueva contraseña"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="input w-full"
            placeholder="https://..."
            autoFocus
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="input w-full"
            placeholder="email@ejemplo.com"
            autoFocus
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="input w-full"
            autoFocus
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="input w-full"
            autoFocus
          />
        );
    }
  };

  const fieldTypeLabels = {
    password: 'Contraseña',
    url: 'URL',
    email: 'Email',
    date: 'Fecha',
    text: 'Texto',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Campo</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {field.fieldName} · {fieldTypeLabels[field.fieldType] || field.fieldType}
              {field.isEncrypted && ' · Encriptado'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nuevo valor para <span className="font-semibold">{field.fieldName}</span>
            </label>
            {renderInput()}
            {field.fieldType === 'password' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Deja vacío para mantener el valor actual
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambio</button>
          </div>
        </form>
      </div>
    </div>
  );
};
