import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Tabla de referencia de permisos por nivel de acceso
 *
 * Props:
 * - resourceType: string (opcional) - Tipo de recurso para personalizar acciones
 * - compact: boolean (opcional) - Versión compacta de la tabla
 */
export default function PermissionsTable({ resourceType = 'elemento', compact = false }) {
  // Definir permisos por nivel de acceso
  const permissions = [
    {
      action: 'Ver',
      description: 'Ver contenido del ' + resourceType,
      viewer: true,
      commenter: true,
      editor: true,
      admin: true
    },
    {
      action: 'Comentar',
      description: 'Agregar comentarios y discusiones',
      viewer: false,
      commenter: true,
      editor: true,
      admin: true
    },
    {
      action: 'Editar',
      description: 'Modificar contenido y propiedades',
      viewer: false,
      commenter: false,
      editor: true,
      admin: true
    },
    {
      action: 'Eliminar',
      description: 'Eliminar ' + resourceType,
      viewer: false,
      commenter: false,
      editor: false,
      admin: true
    },
    {
      action: 'Compartir',
      description: 'Gestionar permisos y compartir con otros',
      viewer: false,
      commenter: false,
      editor: false,
      admin: true
    }
  ];

  const CheckIcon = ({ allowed }) =>
    allowed ? (
      <Check className="w-5 h-5 text-green-600 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-gray-300 mx-auto" />
    );

  if (compact) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">Acción</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-200">Visualizador</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-200">Comentador</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-200">Editor</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-200">Admin</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.map((perm, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{perm.action}</td>
                <td className="px-3 py-2 text-center">
                  <CheckIcon allowed={perm.viewer} />
                </td>
                <td className="px-3 py-2 text-center">
                  <CheckIcon allowed={perm.commenter} />
                </td>
                <td className="px-3 py-2 text-center">
                  <CheckIcon allowed={perm.editor} />
                </td>
                <td className="px-3 py-2 text-center">
                  <CheckIcon allowed={perm.admin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Niveles de acceso y permisos</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Cada nivel de acceso incluye diferentes permisos sobre el elemento compartido
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Acción</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <span>Visualizador</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Solo lectura</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <span>Comentador</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Ver + comentar</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <span>Editor</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Ver + editar</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <span>Administrador</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Control total</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.map((perm, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{perm.action}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{perm.description}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckIcon allowed={perm.viewer} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckIcon allowed={perm.commenter} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckIcon allowed={perm.editor} />
                </td>
                <td className="px-4 py-3 text-center">
                  <CheckIcon allowed={perm.admin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-t border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Nota:</strong> Los permisos se acumulan de izquierda a derecha. Un Editor tiene todos los
          permisos de Comentador + edición, y un Admin tiene todos los permisos.
        </p>
      </div>
    </div>
  );
}
