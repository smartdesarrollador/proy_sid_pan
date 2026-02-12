import { useState } from 'react';
import { Search, Key, Lock, UnlockKeyhole } from 'lucide-react';
import { permissions as mockPermissions } from '../data/mockData';

function PermissionManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(mockPermissions.map(p => p.category))];

  const filteredPermissions = mockPermissions.filter(perm => {
    const matchesSearch =
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.codename.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || perm.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return <Plus className="w-4 h-4" />;
      case 'read':
        return <Eye className="w-4 h-4" />;
      case 'update':
        return <Edit className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Key className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'text-green-600 bg-green-50';
      case 'read':
        return 'text-blue-600 bg-blue-50';
      case 'update':
        return 'text-yellow-600 bg-yellow-50';
      case 'delete':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Permisos</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {mockPermissions.length} permisos del sistema organizados por categoría
        </p>
      </div>

      {/* Info Banner */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Sistema de permisos granulares
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Los permisos se asignan a roles. Los usuarios heredan permisos de sus roles asignados.
              Los permisos con scope "own" o "department" restringen el acceso según el contexto.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar permisos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category}</h3>
                <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {perms.length} permisos
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {perms.map((perm) => (
                <div key={perm.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getActionColor(perm.action)}`}>
                        <Key className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {perm.name}
                          </p>
                          {perm.scope && (
                            <span className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs">
                              Scope: {perm.scope}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {perm.codename}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                            {perm.resource}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className={`badge text-xs ${
                            perm.action === 'delete' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                            perm.action === 'create' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            perm.action === 'update' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {perm.action}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                        Ver roles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredPermissions.length === 0 && (
        <div className="card p-12 text-center">
          <UnlockKeyhole className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron permisos</p>
        </div>
      )}
    </div>
  );
}

// Import missing icons
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default PermissionManagement;
