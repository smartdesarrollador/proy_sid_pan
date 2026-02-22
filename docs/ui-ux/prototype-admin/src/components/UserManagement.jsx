import { useState } from 'react';
import { Search, Plus, MoreVertical, Mail, Shield, Trash2, Edit, CheckCircle, Clock, Lock, X, Key, Eye, ChevronRight, User, Calendar } from 'lucide-react';
import { users as mockUsers, rolePermissions, permissions as allPermissions } from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';

// Recursos agrupados por categoría (para mostrar permisos en el detalle)
const RESOURCE_CATEGORY = {
  users: 'Usuarios', roles: 'Roles',
  tasks: 'Tareas', boards: 'Tareas',
  calendar: 'Calendario',
  landing: 'Landing Pages', branding: 'Landing Pages', forms: 'Landing Pages',
  projects: 'Proyectos', credentials: 'Proyectos', portfolio: 'Proyectos',
  digital_services: 'Servicios Digitales', public_profiles: 'Servicios Digitales',
  billing: 'Facturación', promotions: 'Facturación',
  customers: 'Clientes', subscriptions: 'Clientes',
  analytics: 'Analytics',
  settings: 'Configuración',
  audit: 'Auditoría',
  dashboard: 'Dashboard',
};

const ACTION_BADGE = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  read: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  edit: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

// Devuelve la lista de permisos únicos (strings) de un usuario según sus roles
function getEffectivePermissions(roles) {
  const set = new Set();
  roles.forEach(role => {
    (rolePermissions[role] || []).forEach(p => set.add(p));
  });
  return Array.from(set);
}

// Devuelve permisos agrupados por categoría, buscando metadata en allPermissions
function groupPermsByCategory(permStrings) {
  const groups = {};
  permStrings.forEach(perm => {
    const [resource, action] = perm.split('.');
    const category = RESOURCE_CATEGORY[resource] || resource;
    if (!groups[category]) groups[category] = [];
    // Buscar metadata en allPermissions
    const meta = allPermissions.find(p => p.codename === perm);
    groups[category].push({
      codename: perm,
      name: meta ? meta.name : perm,
      action: action === '*' ? 'all' : action,
    });
  });
  return groups;
}

// Usuarios "pertinentes" = tienen al menos un rol distinto a Viewer (que tienen permisos sustanciales)
function hasSubstantialPermissions(roles) {
  return roles.some(r => r !== 'Viewer');
}

function UserManagement() {
  const { canInviteUsers, canEditUsers, canDeleteUsers } = usePermissions();
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const isReadOnly = !canEditUsers() && !canDeleteUsers();

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {users.length} usuarios en total
            {isReadOnly && <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-medium">(Solo lectura)</span>}
          </p>
        </div>
        {canInviteUsers() ? (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Invitar Usuario
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
            <Lock className="w-4 h-4" />
            Sin permisos para invitar
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MFA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 dark:text-primary-300 font-medium text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, idx) => (
                        <span
                          key={idx}
                          className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {user.status === 'active' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Activo</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> Pendiente</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.mfaEnabled ? (
                      <span className="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Shield className="w-3 h-3 mr-1" /> Habilitado
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Deshabilitado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLogin || 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailUser(user)}
                        title="Ver detalle y permisos"
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEditUsers() ? (
                        <button
                          onClick={() => setDetailUser(user)}
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
                      {canDeleteUsers() ? (
                        <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
                      <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {detailUser && (() => {
        const effectivePerms = getEffectivePermissions(detailUser.roles);
        const groupedPerms = groupPermsByCategory(effectivePerms);
        const isPertinenteUser = hasSubstantialPermissions(detailUser.roles);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
            <div className="bg-white dark:bg-gray-800 h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 dark:text-primary-300 font-bold text-lg">
                      {detailUser.firstName.charAt(0)}{detailUser.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {detailUser.firstName} {detailUser.lastName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{detailUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailUser(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Info básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</p>
                    <span className={`badge ${
                      detailUser.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {detailUser.status === 'active' ? <><CheckCircle className="w-3 h-3 mr-1" />Activo</> : <><Clock className="w-3 h-3 mr-1" />Pendiente</>}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">MFA</p>
                    <span className={`badge ${detailUser.mfaEnabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {detailUser.mfaEnabled ? <><Shield className="w-3 h-3 mr-1" />Habilitado</> : 'Deshabilitado'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Último acceso</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {detailUser.lastLogin || 'Nunca'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Creado</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {detailUser.createdAt}
                    </p>
                  </div>
                </div>

                {/* Roles */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Roles asignados</p>
                  <div className="flex flex-wrap gap-2">
                    {detailUser.roles.map((role, idx) => (
                      <span key={idx} className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sección Permisos — solo para usuarios pertinentes */}
                {isPertinenteUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                          Permisos efectivos
                        </p>
                      </div>
                      <span className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                        {effectivePerms.length} permisos
                      </span>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Permisos heredados de los roles asignados. Los wildcards (<code>*</code>) indican acceso total al recurso.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(groupedPerms).map(([category, perms]) => (
                        <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                              {category}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{perms.length}</span>
                          </div>
                          <div className="px-4 py-2 flex flex-wrap gap-1.5">
                            {perms.map((p, i) => (
                              <span
                                key={i}
                                title={p.codename}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  p.action === 'all' || p.action === '*'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                    : ACTION_BADGE[p.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {p.action === 'all' || p.action === '*' ? `${p.codename.split('.')[0]}.*` : p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
                    <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Acceso de solo lectura</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Este usuario tiene el rol <strong>Viewer</strong> con {effectivePerms.length} permisos básicos de consulta.
                        No se muestra el detalle porque su acceso es limitado por diseño.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer acciones */}
              {canEditUsers() && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={() => setDetailUser(null)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cerrar
                  </button>
                  <button className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar usuario
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invitar Usuario</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select className="input">
                  <option>Member</option>
                  <option>Manager</option>
                  <option>Content Editor</option>
                </select>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Se enviará un email de invitación con un enlace que expira en 7 días.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancelar
              </button>
              <button className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Enviar Invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
