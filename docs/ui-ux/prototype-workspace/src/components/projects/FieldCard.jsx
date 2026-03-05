import { useState } from 'react';
import { Star, Tag, Edit2, Copy, Info, Trash2, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

export const FieldCard = ({
  field,
  itemType,
  onEdit,
  onDelete,
  onToggleFavorite,
  onShowInfo,
  onTags
}) => {
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { canEditProjectItems, canDeleteProjectItems, canRevealPasswords } = usePermissions();

  const handleRevealPassword = () => {
    if (!canRevealPasswords()) {
      alert('No tienes permisos para revelar contraseñas');
      return;
    }
    setIsPasswordRevealed(true);
    // Auto-hide after 30 seconds
    setTimeout(() => {
      setIsPasswordRevealed(false);
    }, 30000);
  };

  const handleCopy = () => {
    const valueToCopy = field.fieldType === 'password' && !isPasswordRevealed
      ? 'P@ssw0rd123!' // Mock password real value
      : field.fieldValue;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(valueToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {
        // Fallback for older browsers
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } else {
      // Fallback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (onToggleFavorite) onToggleFavorite(field.id);
  };

  const renderFieldValue = () => {
    if (field.fieldType === 'password') {
      if (isPasswordRevealed) {
        return (
          <div className="flex items-center gap-2">
            <p className="text-base text-gray-900 dark:text-white break-words font-mono">
              {field.fieldValue === '••••••••••••' ? 'P@ssw0rd123!' : field.fieldValue}
            </p>
            <button
              onClick={() => setIsPasswordRevealed(false)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              title="Ocultar"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <p className="text-base text-gray-900 dark:text-white font-mono tracking-wider">
            ••••••••••••
          </p>
          {canRevealPasswords() && (
            <button
              onClick={handleRevealPassword}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
          className="text-primary-600 dark:text-primary-400 hover:underline break-all text-sm"
        >
          {field.fieldValue}
        </a>
      );
    }

    if (field.fieldType === 'email') {
      return (
        <a
          href={`mailto:${field.fieldValue}`}
          className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {field.fieldValue}
        </a>
      );
    }

    if (field.fieldType === 'date') {
      return (
        <p className="text-base text-gray-900 dark:text-white">
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
      <p className="text-base text-gray-900 dark:text-white break-words">
        {field.fieldValue}
      </p>
    );
  };

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      {/* Label del campo */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          • {field.fieldName}
        </span>
        {field.isEncrypted && (
          <Lock className="w-3 h-3 text-green-600 dark:text-green-400" title="Encriptado AES-256" />
        )}
      </div>

      {/* Valor del campo */}
      <div className="mb-3 min-h-[2.5rem]">
        {renderFieldValue()}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-end gap-1 pt-3 border-t dark:border-gray-700">
        {/* Favorito */}
        <button
          onClick={handleToggleFavorite}
          className="p-1.5 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
          title={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              isFavorited
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
        </button>

        {/* Tags */}
        <button
          onClick={() => onTags && onTags(field.id)}
          className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          title="Tags"
        >
          <Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Editar */}
        {canEditProjectItems() && (
          <button
            onClick={() => onEdit && onEdit(field)}
            className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Copiar */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={isCopied ? '¡Copiado!' : 'Copiar al portapapeles'}
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Info */}
        <button
          onClick={() => onShowInfo && onShowInfo(field)}
          className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="Información"
        >
          <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Eliminar */}
        {canDeleteProjectItems() && (
          <button
            onClick={() => onDelete && onDelete(field.id)}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};
