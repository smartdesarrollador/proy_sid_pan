import React, { useState } from 'react';
import { Link2, Lock } from 'lucide-react';

/**
 * Badge component para indicar si un permiso es heredado o local
 *
 * Props:
 * - isInherited: boolean - Si el permiso es heredado
 * - parentResourceType: string (opcional) - Tipo del recurso padre
 * - parentResourceName: string (opcional) - Nombre del recurso padre
 * - accessLevel: string (opcional) - Nivel de acceso para mostrar en tooltip
 */
export default function InheritedPermissionBadge({
  isInherited,
  parentResourceType,
  parentResourceName,
  accessLevel
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Si es heredado
  if (isInherited) {
    const resourceTypeMap = {
      project: 'Proyecto',
      project_section: 'Sección',
      project_item: 'Item',
      task: 'Tarea',
      event: 'Evento'
    };

    const parentTypeLabel = resourceTypeMap[parentResourceType] || 'elemento';

    return (
      <div className="relative inline-block">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium cursor-help badge-inherited"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Link2 className="w-3 h-3" />
          <span>Heredado</span>
        </span>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
            <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-gray-700">
              <p className="font-medium mb-1">Permiso heredado</p>
              <p className="text-gray-300 dark:text-gray-400">
                Este permiso viene heredado del {parentTypeLabel}
                {parentResourceName && (
                  <>
                    {' '}
                    <span className="font-medium text-white">"{parentResourceName}"</span>
                  </>
                )}
                . Para cambiar el nivel de acceso, edita el permiso en el recurso padre.
              </p>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si es local (no heredado)
  return (
    <div className="relative inline-block">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium cursor-help badge-local"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Lock className="w-3 h-3" />
        <span>Local</span>
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56">
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-gray-700">
            <p className="font-medium mb-1">Permiso local</p>
            <p className="text-gray-300 dark:text-gray-400">
              Este permiso fue compartido específicamente para este elemento. No depende de permisos heredados.
            </p>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}
