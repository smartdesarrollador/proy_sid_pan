import React, { useState, useMemo } from 'react';
import {
  Share2,
  Search,
  Filter,
  ChevronDown,
  FolderOpen,
  CheckSquare,
  Calendar,
  FileText,
  Image,
  File,
  X
} from 'lucide-react';
import { useSharing } from '../../hooks/useSharing';
import ShareAccessLevelBadge from './ShareAccessLevelBadge';
import InheritedPermissionBadge from './InheritedPermissionBadge';

/**
 * Vista completa de elementos compartidos con el usuario actual
 *
 * Props:
 * - currentPlan: string (default: 'professional')
 * - onNavigateToResource: function (opcional) - Callback al abrir un elemento
 */
export default function SharedWithMeView({
  currentPlan = 'professional',
  onNavigateToResource
}) {
  const { sharedWithMe, isLoading } = useSharing(null, null, '', currentPlan);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResourceTypes, setSelectedResourceTypes] = useState([]);
  const [selectedAccessLevels, setSelectedAccessLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Resource type options
  const resourceTypeOptions = [
    { value: 'project', label: 'Proyectos', icon: FolderOpen, color: 'text-blue-600' },
    { value: 'project_section', label: 'Secciones', icon: FolderOpen, color: 'text-purple-600' },
    { value: 'project_item', label: 'Items', icon: FileText, color: 'text-green-600' },
    { value: 'task', label: 'Tareas', icon: CheckSquare, color: 'text-orange-600' },
    { value: 'event', label: 'Eventos', icon: Calendar, color: 'text-red-600' },
    { value: 'file', label: 'Archivos', icon: File, color: 'text-gray-600' },
    { value: 'document', label: 'Documentos', icon: FileText, color: 'text-indigo-600' },
    { value: 'note', label: 'Notas', icon: FileText, color: 'text-yellow-600' }
  ];

  // Access level options
  const accessLevelOptions = [
    { value: 'viewer', label: 'Visualizador' },
    { value: 'commenter', label: 'Comentador' },
    { value: 'editor', label: 'Editor' },
    { value: 'admin', label: 'Administrador' }
  ];

  // Toggle resource type filter
  const toggleResourceType = (type) => {
    setSelectedResourceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Toggle access level filter
  const toggleAccessLevel = (level) => {
    setSelectedAccessLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedResourceTypes([]);
    setSelectedAccessLevels([]);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = [...sharedWithMe];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.resourceName.toLowerCase().includes(query) ||
          item.sharedByName.toLowerCase().includes(query)
      );
    }

    // Resource type filter
    if (selectedResourceTypes.length > 0) {
      filtered = filtered.filter((item) => selectedResourceTypes.includes(item.resourceType));
    }

    // Access level filter
    if (selectedAccessLevels.length > 0) {
      filtered = filtered.filter((item) => selectedAccessLevels.includes(item.accessLevel));
    }

    return filtered;
  }, [sharedWithMe, searchQuery, selectedResourceTypes, selectedAccessLevels]);

  // Get icon for resource type
  const getResourceIcon = (type) => {
    const option = resourceTypeOptions.find((opt) => opt.value === type);
    return option ? option.icon : File;
  };

  // Get color for resource type
  const getResourceColor = (type) => {
    const option = resourceTypeOptions.find((opt) => opt.value === type);
    return option ? option.color : 'text-gray-600';
  };

  // Get label for resource type
  const getResourceTypeLabel = (type) => {
    const option = resourceTypeOptions.find((opt) => opt.value === type);
    return option ? option.label : type;
  };

  // Handle open resource
  const handleOpenResource = (item) => {
    if (onNavigateToResource) {
      onNavigateToResource(item);
    } else {
      console.log('Navigate to:', item.resourceType, item.resourceId);
    }
  };

  // Active filters count
  const activeFiltersCount = selectedResourceTypes.length + selectedAccessLevels.length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compartidos conmigo</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Elementos que otros usuarios han compartido contigo
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{sharedWithMe.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">elementos compartidos</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors
              ${showFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}
            `}
          >
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resource Type Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Tipo de recurso
                </label>
                <div className="flex flex-wrap gap-2">
                  {resourceTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleResourceType(option.value)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                        ${
                          selectedResourceTypes.includes(option.value)
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <option.icon className={`w-4 h-4 ${option.color}`} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Access Level Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Nivel de acceso
                </label>
                <div className="flex flex-wrap gap-2">
                  {accessLevelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleAccessLevel(option.value)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${
                          selectedAccessLevels.includes(option.value)
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Share2 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {sharedWithMe.length === 0
                ? 'No tienes elementos compartidos'
                : 'No se encontraron elementos'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {sharedWithMe.length === 0
                ? 'Cuando otros usuarios compartan elementos contigo, aparecerán aquí.'
                : 'Intenta ajustar los filtros de búsqueda.'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const ResourceIcon = getResourceIcon(item.resourceType);
              const iconColor = getResourceColor(item.resourceType);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenResource(item)}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 bg-gray-50 dark:bg-gray-700 rounded-lg ${iconColor}`}>
                        <ResourceIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {item.resourceName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getResourceTypeLabel(item.resourceType)}
                        </p>
                      </div>
                    </div>

                    {/* Shared By */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Compartido por:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.sharedByName}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <ShareAccessLevelBadge level={item.accessLevel} size="sm" />
                      {item.isInherited && (
                        <InheritedPermissionBadge
                          isInherited={item.isInherited}
                          parentResourceType={item.parentResourceType}
                          parentResourceName={item.parentResourceName}
                        />
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span>
                        Compartido: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.expiresAt && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          Expira: {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Message (if present) */}
                    {item.message && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300 border-l-2 border-blue-400 dark:border-blue-500">
                        {item.message}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
