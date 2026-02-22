import { useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Download,
  BarChart3,
  Activity,
  Shield,
  Lock
} from 'lucide-react';
import { reportStats, users } from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';

// ===========================
// Sub-componente: KPICard
// ===========================
function KPICard({ label, value, subtitle, icon: Icon, color }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}

// ===========================
// Sub-componente: ActivityBadge
// ===========================
function ActivityBadge({ lastLogin }) {
  if (!lastLogin) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        Inactivo
      </span>
    );
  }

  const loginDate = new Date(lastLogin);
  const now = new Date('2026-02-22');
  const diffDays = Math.floor((now - loginDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Muy activo
      </span>
    );
  } else if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        Activo
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        Inactivo
      </span>
    );
  }
}

// ===========================
// Componente principal
// ===========================
function Reports() {
  const { hasPermission } = usePermissions();
  const [exportLoading, setExportLoading] = useState(false);

  const canReadBilling = hasPermission('billing.read');

  const handleExport = () => {
    setExportLoading(true);
    setTimeout(() => setExportLoading(false), 1500);
  };

  const { userActivity, roleDistribution, topPermissions, billingOverview, monthlyGrowth } = reportStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Métricas y estadísticas del sistema
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {exportLoading ? 'Exportando...' : 'Exportar'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Usuarios Activos"
          value={userActivity.activeUsers}
          subtitle={`de ${userActivity.activeUsers + userActivity.inactiveUsers} totales`}
          icon={Users}
          color="bg-blue-500"
        />
        <KPICard
          label="MRR"
          value={`$${billingOverview.mrr.toFixed(2)}`}
          subtitle={`ARR: $${billingOverview.arr.toFixed(2)}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <KPICard
          label="Tasa de conversión"
          value={`${userActivity.trialConversions || 0} trials`}
          subtitle={`Churn: ${userActivity.churnRate}%`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <KPICard
          label="Nuevos este mes"
          value={userActivity.newThisMonth}
          subtitle="usuarios registrados"
          icon={UserPlus}
          color="bg-orange-500"
        />
      </div>

      {/* Actividad de Usuarios */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Actividad de Usuarios
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Usuario</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Rol</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Último acceso</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-gray-700 dark:text-gray-300">{user.roles[0]}</span>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="py-3">
                    <ActivityBadge lastLogin={user.lastLogin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Roles */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribución de Roles
            </h3>
          </div>
          <div className="space-y-3">
            {roleDistribution.map((item) => (
              <div key={item.role}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.role}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Permisos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permisos Más Usados
            </h3>
          </div>
          <div className="space-y-3">
            {topPermissions.map((item, idx) => (
              <div key={item.permission} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {item.permission}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.usageCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${(item.usageCount / topPermissions[0].usageCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de Facturación (solo si billing.read) */}
      {canReadBilling && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumen de Facturación
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                ${billingOverview.mrr.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MRR</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                ${billingOverview.arr.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ARR</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                ${billingOverview.avgRevenuePerUser.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ARPU</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {billingOverview.trialConversions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Conversiones de trial</p>
            </div>
          </div>

          {/* Crecimiento mensual */}
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Crecimiento Mensual (últimos 6 meses)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Mes</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Usuarios</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {monthlyGrowth.map((row) => (
                  <tr key={row.month}>
                    <td className="py-2 text-gray-700 dark:text-gray-300">{row.month}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">{row.users}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">${row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
