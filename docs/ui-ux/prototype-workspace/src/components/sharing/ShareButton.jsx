import React, { useState } from 'react';
import { Share2, Users, Lock } from 'lucide-react';
import ShareModal from './ShareModal';
import { useSharing } from '../../hooks/useSharing';

/**
 * Botón para compartir elementos con tooltip de feature gate
 *
 * Props:
 * - resourceType: string - Tipo de recurso ('project', 'task', 'event', etc.)
 * - resourceId: string - ID del recurso
 * - resourceName: string - Nombre del recurso
 * - currentUserRole: string (opcional) - Rol del usuario actual en el recurso
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - variant: 'primary' | 'secondary' | 'ghost' (default: 'secondary')
 * - currentPlan: string (default: 'professional')
 * - showCounter: boolean (default: true) - Mostrar contador de usuarios compartidos
 * - onShareSuccess: function (opcional) - Callback después de compartir exitosamente
 */
export default function ShareButton({
  resourceType,
  resourceId,
  resourceName,
  currentUserRole = 'owner',
  size = 'md',
  variant = 'secondary',
  currentPlan = 'professional',
  showCounter = true,
  onShareSuccess
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { canShare, shares, isAtShareLimit, shareLimit } = useSharing(
    resourceType,
    resourceId,
    resourceName,
    currentPlan
  );

  // Size classes
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Variant classes
  const variantClasses = {
    primary:
      'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed',
    secondary:
      'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed'
  };

  const disabled = !canShare;

  const handleClick = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleShareSuccess = () => {
    if (onShareSuccess) {
      onShareSuccess();
    }
  };

  // Tooltip content
  const getTooltipContent = () => {
    if (!canShare) {
      return 'Tu plan no permite compartir elementos. Actualiza a Plan Starter o superior.';
    }
    if (isAtShareLimit && shareLimit !== Infinity) {
      return `Límite alcanzado: puedes compartir con máximo ${shareLimit} usuarios.`;
    }
    return 'Compartir con otros usuarios';
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={handleClick}
          disabled={disabled}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            inline-flex items-center gap-2 font-medium rounded-lg
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${sizeClasses[size]}
            ${variantClasses[variant]}
          `}
        >
          {/* Icon */}
          {disabled ? (
            <Lock className={iconSizes[size]} />
          ) : (
            <Share2 className={iconSizes[size]} />
          )}

          {/* Label */}
          <span>Compartir</span>

          {/* Counter badge */}
          {showCounter && shares.length > 0 && (
            <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
              <Users className="w-3 h-3" />
              {shares.length}
            </span>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg text-center">
              {getTooltipContent()}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-6 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isModalOpen && (
        <ShareModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          resourceType={resourceType}
          resourceId={resourceId}
          resourceName={resourceName}
          currentPlan={currentPlan}
          onShareSuccess={handleShareSuccess}
        />
      )}
    </>
  );
}
