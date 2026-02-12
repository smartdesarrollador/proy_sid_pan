import { useState } from 'react';
import { Plus, Edit, Trash2, Users, Lock, ChevronRight, Shield } from 'lucide-react';
import { roles as mockRoles, permissions } from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';

function RoleManagement() {
  const { canCreateRoles, canEditRoles, canDeleteRoles } = usePermissions();
  const [roles, setRoles] = useState(mockRoles);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isReadOnly = !canEditRoles() && !canDeleteRoles();

  const getRolePermissions = (roleId) => {
    // Simulación de obtener permisos del rol
    return permissions.slice(0, Math.floor(Math.random() * 15) + 5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Roles</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {roles.length} roles configurados ({roles.filter(r => !r.isSystemRole).length} personalizados)
            {isReadOnly && <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-medium">(Solo lectura)</span>}
          </p>
        </div>
        {canCreateRoles() ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Rol
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
            <Lock className="w-4 h-4" />
            Sin permisos para crear roles
          </div>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="card cursor-pointer hover:shadow-md transition-all group"
            onClick={() => setSelectedRole(role)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: role.color + '20' }}
                  >
                    <Shield
                      className="w-6 h-6"
                      style={{ color: role.color }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      {role.isSystemRole && (
                        <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                          Sistema
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{role.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
              </div>

              {role.parentRole && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Hereda permisos de: <span className="font-medium text-gray-900 dark:text-white">{role.parentRole}</span>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{role.usersCount} usuarios</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Lock className="w-4 h-4" />
                    <span>{role.permissionsCount} permisos</span>
                  </div>
                </div>

                {!role.isSystemRole && (
                  <div className="flex items-center gap-2">
                    {canEditRoles() ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Sin permisos para editar"
                        className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteRoles() ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Sin permisos para eliminar"
                        className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Details Modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: selectedRole.color + '20' }}
                  >
                    <Shield
                      className="w-6 h-6"
                      style={{ color: selectedRole.color }}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRole.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{selectedRole.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRole.usersCount}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Usuarios</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRole.permissionsCount}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Permisos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-300">Creado</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{selectedRole.createdAt}</p>
                </div>
              </div>

              {/* Permissions List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Permisos Asignados</h3>
                <div className="space-y-2">
                  {getRolePermissions(selectedRole.id).map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{permission.codename}</p>
                      </div>
                      <span className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 text-xs">
                        {permission.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedRole(null)}
                className="w-full btn btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Crear Nuevo Rol</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Rol
                </label>
                <input
                  type="text"
                  placeholder="Ej: Content Manager"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  placeholder="Describe las responsabilidades de este rol..."
                  rows={3}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heredar de (opcional)
                </label>
                <select className="input">
                  <option>Sin herencia</option>
                  <option>Member</option>
                  <option>Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancelar
              </button>
              <button className="flex-1 btn btn-primary">
                Crear Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;
