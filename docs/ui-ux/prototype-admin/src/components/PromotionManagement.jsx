import { useState, useMemo } from 'react';
import { Plus, Tag, DollarSign, TrendingUp, Search, Filter, Edit2, Trash2, PlayCircle, PauseCircle, BarChart3 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { promotions as mockPromotions, filterPromotions } from '../data/mockData';
import PromotionModal from './PromotionModal';
import PromotionStatsModal from './PromotionStatsModal';

function PromotionManagement() {
  const { hasPermission } = usePermissions();
  const [promotions, setPromotions] = useState(mockPromotions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  });

  // Check permissions
  const canCreate = hasPermission('promotions.create');
  const canUpdate = hasPermission('promotions.update');
  const canDelete = hasPermission('promotions.delete');
  const canViewStats = hasPermission('promotions.stats');

  // Filter promotions
  const filteredPromotions = useMemo(() =>
    filterPromotions(promotions, filters),
    [promotions, filters]
  );

  // Calculate stats
  const stats = useMemo(() => ({
    totalActive: promotions.filter(p => p.status === 'active').length,
    totalUses: promotions.reduce((sum, p) => sum + p.currentUses, 0),
    totalRevenue: promotions.reduce((sum, p) => sum + p.totalRevenue, 0)
  }), [promotions]);

  // Handle create
  const handleCreate = () => {
    if (!canCreate) {
      alert('No tienes permiso para crear promociones');
      return;
    }
    setEditingPromotion(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (promotion) => {
    if (!canUpdate) {
      alert('No tienes permiso para editar promociones');
      return;
    }
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  // Handle save
  const handleSave = (formData) => {
    if (editingPromotion) {
      // Update existing
      setPromotions(promotions.map(p =>
        p.id === editingPromotion.id
          ? { ...editingPromotion, ...formData }
          : p
      ));
    } else {
      // Create new
      const newPromotion = {
        ...formData,
        id: `promo-${Date.now()}`,
        currentUses: 0,
        status: 'active',
        createdBy: 'user-001',
        createdAt: new Date().toISOString().split('T')[0],
        lastUsedAt: null,
        conversionRate: 0,
        totalRevenue: 0,
        avgDiscountAmount: 0
      };
      setPromotions([...promotions, newPromotion]);
    }
    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  // Handle toggle status
  const handleToggleStatus = (promotion) => {
    if (!canUpdate) {
      alert('No tienes permiso para cambiar el estado de promociones');
      return;
    }

    // No se puede activar una promoción expirada o agotada
    if (promotion.status === 'expired') {
      alert('No se puede activar una promoción expirada');
      return;
    }
    if (promotion.status === 'depleted') {
      alert('No se puede activar una promoción agotada');
      return;
    }

    const newStatus = promotion.status === 'active' ? 'paused' : 'active';
    const confirmMessage = newStatus === 'paused'
      ? '¿Pausar esta promoción? Los clientes no podrán usarla temporalmente.'
      : '¿Activar esta promoción? Los clientes podrán usarla inmediatamente.';

    if (confirm(confirmMessage)) {
      setPromotions(promotions.map(p =>
        p.id === promotion.id ? { ...p, status: newStatus } : p
      ));
    }
  };

  // Handle delete
  const handleDelete = (promotion) => {
    if (!canDelete) {
      alert('No tienes permiso para eliminar promociones');
      return;
    }

    const hasUses = promotion.currentUses > 0;
    const confirmMessage = hasUses
      ? `Esta promoción tiene ${promotion.currentUses} usos registrados. ¿Estás seguro de eliminarla? Esta acción no se puede deshacer.`
      : '¿Eliminar esta promoción? Esta acción no se puede deshacer.';

    if (confirm(confirmMessage)) {
      setPromotions(promotions.filter(p => p.id !== promotion.id));
    }
  };

  // Handle view stats
  const handleViewStats = (promotion) => {
    if (!canViewStats) {
      alert('No tienes permiso para ver estadísticas de promociones');
      return;
    }
    setSelectedPromotion(promotion);
    setIsStatsModalOpen(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      expired: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      depleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    const labels = {
      active: 'Activa',
      paused: 'Pausada',
      expired: 'Expirada',
      depleted: 'Agotada'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const labels = {
      percentage: '%',
      fixed_amount: '$',
      trial_extension: '+días'
    };

    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
        {labels[type]}
      </span>
    );
  };

  // Format value
  const formatValue = (promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}%`;
      case 'fixed_amount':
        return `$${promotion.value}`;
      case 'trial_extension':
        return `+${promotion.value} días`;
      default:
        return promotion.value;
    }
  };

  // Calculate usage percentage
  const getUsagePercentage = (promotion) => {
    if (!promotion.maxUses) return 0;
    return (promotion.currentUses / promotion.maxUses) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Promociones</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Administra códigos de descuento y promociones especiales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Promociones Activas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalActive}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usos Totales</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Generados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="paused">Pausadas</option>
              <option value="expired">Expiradas</option>
              <option value="depleted">Agotadas</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos los tipos</option>
            <option value="percentage">Porcentaje</option>
            <option value="fixed_amount">Monto Fijo</option>
            <option value="trial_extension">Trial Extension</option>
          </select>

          {/* Clear Filters */}
          {(filters.search || filters.status !== 'all' || filters.type !== 'all') && (
            <button
              onClick={() => setFilters({ search: '', status: 'all', type: 'all' })}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Limpiar
            </button>
          )}

          {/* Create Button */}
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nueva Promoción
            </button>
          )}
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPromotions.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron promociones
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filters.search || filters.status !== 'all' || filters.type !== 'all'
                ? 'Intenta ajustar los filtros'
                : 'Comienza creando tu primera promoción'}
            </p>
            {canCreate && (filters.search || filters.status !== 'all' || filters.type !== 'all') === false && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Promoción
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPromotions.map((promotion) => (
                  <tr
                    key={promotion.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      promotion.status === 'expired' || promotion.status === 'depleted'
                        ? 'opacity-60'
                        : promotion.status === 'paused'
                        ? 'opacity-70'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-primary-600 dark:text-primary-400 rounded text-sm font-mono">
                        {promotion.code}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {promotion.name}
                      </div>
                      {promotion.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {promotion.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(promotion.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatValue(promotion)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${
                              getUsagePercentage(promotion) >= 90
                                ? 'bg-red-500'
                                : getUsagePercentage(promotion) >= 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(getUsagePercentage(promotion), 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {promotion.currentUses}{promotion.maxUses ? `/${promotion.maxUses}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div>{promotion.startsAt}</div>
                      <div className="text-xs">{promotion.expiresAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(promotion.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        {canViewStats && (
                          <button
                            onClick={() => handleViewStats(promotion)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Ver estadísticas"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(promotion)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canUpdate && promotion.status !== 'expired' && promotion.status !== 'depleted' && (
                          <button
                            onClick={() => handleToggleStatus(promotion)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={promotion.status === 'active' ? 'Pausar' : 'Activar'}
                          >
                            {promotion.status === 'active' ? (
                              <PauseCircle className="w-4 h-4" />
                            ) : (
                              <PlayCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(promotion)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <PromotionModal
          promotion={editingPromotion}
          allPromotions={promotions}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPromotion(null);
          }}
        />
      )}

      {isStatsModalOpen && selectedPromotion && (
        <PromotionStatsModal
          promotion={selectedPromotion}
          onClose={() => {
            setIsStatsModalOpen(false);
            setSelectedPromotion(null);
          }}
        />
      )}
    </div>
  );
}

export default PromotionManagement;
