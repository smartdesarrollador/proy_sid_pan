import { useState } from 'react';
import { Star, Tag, Edit2, Copy, Info, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

export const FieldCard = ({
  field,
  itemType,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  onShowInfo,
  onTags
}) => {
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const { canEditProjectItems, canDeleteProjectItems, canRevealPasswords } = usePermissions();

  // Mock: determinar si es favorito (en producción vendría del item)
  const isFavorite = false;

  const handleRevealPassword = () => {
    if (!canRevealPasswords()) {
      alert('No tienes permisos para revelar contraseñas');
      return;
    }
    setIsPasswordRevealed(true);
    // Auto-hide después de 30 segundos
    setTimeout(() => {
      setIsPasswordRevealed(false);
    }, 30000);
  };

  const renderFieldValue = () => {
    if (field.fieldType === 'password') {
      if (isPasswordRevealed) {
        return (
          <div className="flex items-center gap-2">
            <p className="text-base text-gray-900 break-words font-mono">
              {field.fieldValue === '••••••••••••' ? 'P@ssw0rd123!' : field.fieldValue}
            </p>
            <button
              onClick={() => setIsPasswordRevealed(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Ocultar"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <p className="text-base text-gray-900 font-mono tracking-wider">
            ••••••••••••
          </p>
          {canRevealPasswords() && (
            <button
              onClick={handleRevealPassword}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Revelar contraseña"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (field.fieldType === 'url') {
      return (
        <a
          href={field.fieldValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline break-all text-sm"
        >
          {field.fieldValue}
        </a>
      );
    }

    if (field.fieldType === 'email') {
      return (
        <a
          href={`mailto:${field.fieldValue}`}
          className="text-primary-600 hover:underline text-sm"
        >
          {field.fieldValue}
        </a>
      );
    }

    if (field.fieldType === 'date') {
      return (
        <p className="text-base text-gray-900">
          {new Date(field.fieldValue).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      );
    }

    // Default: text
    return (
      <p className="text-base text-gray-900 break-words">
        {field.fieldValue}
      </p>
    );
  };

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      {/* Label del campo */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-600">
          • {field.fieldName}
        </span>
        {field.isEncrypted && (
          <Lock className="w-3 h-3 text-green-600" title="Encriptado AES-256" />
        )}
      </div>

      {/* Valor del campo */}
      <div className="mb-3 min-h-[2.5rem]">
        {renderFieldValue()}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-end gap-1 pt-3 border-t">
        {/* Favorito */}
        <button
          onClick={() => onToggleFavorite(field.id)}
          className="p-1.5 rounded hover:bg-yellow-50 transition-colors"
          title="Favorito"
        >
          <Star
            className={`w-4 h-4 ${
              isFavorite
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-gray-400'
            }`}
          />
        </button>

        {/* Tags */}
        <button
          onClick={() => onTags(field.id)}
          className="p-1.5 rounded hover:bg-orange-50 transition-colors"
          title="Tags"
        >
          <Tag className="w-4 h-4 text-gray-600" />
        </button>

        {/* Editar */}
        {canEditProjectItems() && (
          <button
            onClick={() => onEdit(field)}
            className="p-1.5 rounded hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Copiar */}
        <button
          onClick={() => {
            const valueToCopy = field.fieldType === 'password' && !isPasswordRevealed
              ? 'P@ssw0rd123!' // Mock password real
              : field.fieldValue;
            onCopy(valueToCopy);
          }}
          className="p-1.5 rounded hover:bg-gray-50 transition-colors"
          title="Copiar"
        >
          <Copy className="w-4 h-4 text-gray-600" />
        </button>

        {/* Info */}
        <button
          onClick={() => onShowInfo(field)}
          className="p-1.5 rounded hover:bg-blue-50 transition-colors"
          title="Información"
        >
          <Info className="w-4 h-4 text-gray-600" />
        </button>

        {/* Eliminar */}
        {canDeleteProjectItems() && (
          <button
            onClick={() => onDelete(field.id)}
            className="p-1.5 rounded hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
};
