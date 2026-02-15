import { X, TrendingUp, Users, DollarSign, Percent, Calendar } from 'lucide-react';

function PromotionStatsModal({ promotion, onClose }) {
  // Mock data de usos por día (últimos 30 días)
  const usageByDay = [
    { date: '2026-02-01', uses: 3 },
    { date: '2026-02-02', uses: 5 },
    { date: '2026-02-03', uses: 2 },
    { date: '2026-02-04', uses: 4 },
    { date: '2026-02-05', uses: 6 },
    { date: '2026-02-06', uses: 8 },
    { date: '2026-02-07', uses: 4 },
    { date: '2026-02-08', uses: 7 },
    { date: '2026-02-09', uses: 5 },
    { date: '2026-02-10', uses: 9 },
  ];

  // Mock top customers
  const topCustomers = [
    { id: 'customer-001', name: 'Acme Corporation', uses: 5, revenue: 495.00 },
    { id: 'customer-002', name: 'TechStart Solutions', uses: 4, revenue: 396.00 },
    { id: 'customer-003', name: 'Global Logistics Inc', uses: 3, revenue: 297.00 },
    { id: 'customer-004', name: 'Design Studio Pro', uses: 2, revenue: 198.00 },
    { id: 'customer-005', name: 'Retail Solutions SA', uses: 1, revenue: 99.00 },
  ];

  const maxUses = Math.max(...usageByDay.map(d => d.uses));

  // Format value
  const formatValue = () => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}% de descuento`;
      case 'fixed_amount':
        return `$${promotion.value} de descuento`;
      case 'trial_extension':
        return `+${promotion.value} días de trial`;
      default:
        return promotion.value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <code className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-lg font-mono font-semibold">
                {promotion.code}
              </code>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                promotion.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {promotion.status === 'active' ? 'Activa' : promotion.status === 'paused' ? 'Pausada' : promotion.status === 'expired' ? 'Expirada' : 'Agotada'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {promotion.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatValue()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Usos</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {promotion.currentUses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Conversión</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {promotion.conversionRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Ingresos</p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    ${promotion.totalRevenue.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Descuento Avg</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    ${promotion.avgDiscountAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Chart */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usos por Día</h3>
            </div>
            <div className="space-y-2">
              {usageByDay.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">
                    {new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${(day.uses / maxUses) * 100}%` }}
                    >
                      {day.uses > 0 && (
                        <span className="text-xs font-medium text-white">{day.uses}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Clientes que Usaron Esta Promoción
            </h3>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : index === 1
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.uses} {customer.uses === 1 ? 'uso' : 'usos'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${customer.revenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promotion Details */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalles de la Promoción
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descripción</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.description || 'Sin descripción'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Descuento</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.type === 'percentage' ? 'Porcentaje' : promotion.type === 'fixed_amount' ? 'Monto Fijo' : 'Trial Extension'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vigencia</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.startsAt} → {promotion.expiresAt}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Límites</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.maxUses ? `${promotion.maxUses} usos totales` : 'Usos ilimitados'} · {promotion.maxUsesPerCustomer} por cliente
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Planes Aplicables</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.applicablePlans.length === 0 ? 'Todos los planes' : `${promotion.applicablePlans.length} plan(es)`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Solo Nuevos Clientes</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.applicableNewCustomersOnly ? 'Sí' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Creado</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.createdAt}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Último Uso</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {promotion.lastUsedAt || 'Nunca usado'}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromotionStatsModal;
