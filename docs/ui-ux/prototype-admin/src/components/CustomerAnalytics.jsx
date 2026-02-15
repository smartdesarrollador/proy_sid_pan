import { useMemo, useState } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  BarChart3,
  Filter
} from 'lucide-react';
import {
  customers,
  subscriptionPlans,
  calculateMetrics,
  calculatePlanDistribution,
  calculateStatusDistribution,
  getTopCustomersByMRR,
  getAtRiskCustomers
} from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';
import { useFeatureGate } from '../hooks/useFeatureGate';

// ===========================
// Sub-componente: KPICard
// ===========================
function KPICard({ label, value, change, trend, icon: Icon, color }) {
  const trendColor = trend?.startsWith('+') ? 'text-green-600 dark:text-green-400' :
                     trend?.startsWith('-') ? 'text-red-600 dark:text-red-400' :
                     'text-gray-600 dark:text-gray-300';

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{label}</p>

      {change && (
        <div className="flex items-center gap-2 text-xs">
          <span className={trendColor}>{change}</span>
          {trend && <span className="text-gray-500 dark:text-gray-400">{trend}</span>}
        </div>
      )}
    </div>
  );
}

// ===========================
// Sub-componente: PlanDistributionCard
// ===========================
function PlanDistributionCard({ data }) {
  const planColors = {
    'Free': 'bg-gray-400',
    'Starter': 'bg-blue-500',
    'Professional': 'bg-purple-500',
    'Enterprise': 'bg-orange-500'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Distribución por Plan
        </h3>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.plan}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.plan}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`${planColors[item.plan] || 'bg-gray-400'} h-2.5 rounded-full transition-all`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================
// Sub-componente: StatusDistributionCard
// ===========================
function StatusDistributionCard({ data }) {
  const statusColors = {
    'active': 'bg-green-500',
    'trial': 'bg-blue-500',
    'past_due': 'bg-red-500',
    'cancelled': 'bg-gray-400'
  };

  const statusLabels = {
    'active': 'Activo',
    'trial': 'Prueba',
    'past_due': 'Pago Vencido',
    'cancelled': 'Cancelado'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Distribución por Estado
        </h3>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.status}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {statusLabels[item.status] || item.status}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`${statusColors[item.status] || 'bg-gray-400'} h-2.5 rounded-full transition-all`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================
// Sub-componente: MRRByPlanCard
// ===========================
function MRRByPlanCard({ data }) {
  const totalMRR = data.reduce((sum, item) => sum + parseFloat(item.mrr), 0);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          MRR por Plan
        </h3>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          ${totalMRR.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Total MRR</div>
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const percentage = totalMRR > 0 ? ((parseFloat(item.mrr) / totalMRR) * 100).toFixed(1) : 0;
          return (
            <div key={item.plan} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.plan}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${item.mrr}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================
// Sub-componente: TopCustomersTable
// ===========================
function TopCustomersTable({ customers }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top 5 Clientes por MRR
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                MRR
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuarios
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                  {index + 1}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: customer.primaryColor }}
                    >
                      {getInitials(customer.companyName)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.companyName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {customer.subscription.planName}
                  </span>
                </td>
                <td className="py-3 px-2 text-sm text-right font-semibold text-gray-900 dark:text-white">
                  ${customer.subscription.mrr}
                </td>
                <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-400">
                  {customer.usage.users.current}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================
// Sub-componente: AtRiskCustomersCard
// ===========================
function AtRiskCustomersCard({ customers }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="card p-6 border-2 border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
          Clientes en Riesgo ({customers.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                style={{ backgroundColor: customer.primaryColor }}
              >
                {getInitials(customer.companyName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {customer.companyName}
                </div>
                <div className="mt-1 space-y-1">
                  {customer.riskReasons.map((reason, index) => (
                    <div key={index} className="text-xs text-red-600 dark:text-red-400">
                      • {reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================
// Sub-componente: UpgradePrompt
// ===========================
function UpgradePrompt({ feature }) {
  return (
    <div className="card p-8 text-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-4">
        <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {feature.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
        {feature.message}
      </p>
      <button className="btn btn-primary px-6 py-3">
        Actualizar a Professional
      </button>
    </div>
  );
}

// ===========================
// Componente Principal: CustomerAnalytics
// ===========================
function CustomerAnalytics() {
  const { hasPermission } = usePermissions();
  const { hasFeature } = useFeatureGate();

  // State para filtros
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Calcular métricas con useMemo para optimizar
  const metrics = useMemo(
    () => calculateMetrics(customers, selectedPlan, selectedStatus),
    [selectedPlan, selectedStatus]
  );

  const planDistribution = useMemo(() => calculatePlanDistribution(customers), []);
  const statusDistribution = useMemo(() => calculateStatusDistribution(customers), []);
  const topCustomers = useMemo(() => getTopCustomersByMRR(customers, 5), []);
  const atRiskCustomers = useMemo(() => getAtRiskCustomers(customers), []);

  // Verificar permisos
  if (!hasPermission('analytics.read')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sin permiso de acceso
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            No tienes permisos para ver esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Estadísticas de Clientes
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Análisis de métricas de negocio y base de clientes
        </p>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtros:
            </span>
          </div>

          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los planes</option>
            {subscriptionPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="trial">Prueba</option>
            <option value="past_due">Pago Vencido</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {(selectedPlan !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSelectedPlan('all');
                setSelectedStatus('all');
              }}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Clientes Activos"
          value={metrics.totalActiveCustomers}
          change="+12%"
          trend="vs mes anterior"
          icon={Building2}
          color="bg-blue-500"
        />
        <KPICard
          label="MRR Total"
          value={`$${metrics.totalMRR}`}
          change="+8%"
          trend="vs mes anterior"
          icon={DollarSign}
          color="bg-green-500"
        />
        <KPICard
          label="ARPC"
          value={`$${metrics.arpc}`}
          change="-2%"
          trend="vs mes anterior"
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <KPICard
          label="Health Score"
          value={`${metrics.healthScore}%`}
          change="Estable"
          trend=""
          icon={Activity}
          color="bg-orange-500"
        />
      </div>

      {/* Distribuciones (feature gate: Professional+) */}
      {hasFeature('advancedAnalytics') ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlanDistributionCard data={planDistribution} />
          <StatusDistributionCard data={statusDistribution} />
        </div>
      ) : (
        <UpgradePrompt
          feature={{
            title: 'Análisis Avanzado',
            message:
              'Los gráficos de distribución y análisis avanzados están disponibles en el plan Professional.'
          }}
        />
      )}

      {/* Análisis de ingresos + Top clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MRRByPlanCard data={planDistribution} />
        <TopCustomersTable customers={topCustomers} />
      </div>

      {/* Clientes en riesgo */}
      {atRiskCustomers.length > 0 && (
        <AtRiskCustomersCard customers={atRiskCustomers} />
      )}

      {/* Uso de recursos */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Uso Promedio de Recursos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Usuarios</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.resourceUsage.avgUsersPercentage}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.resourceUsage.avgUsersPercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Storage</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.resourceUsage.avgStoragePercentage}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.resourceUsage.avgStoragePercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">API Calls</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.resourceUsage.avgApiCallsPercentage}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.resourceUsage.avgApiCallsPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerAnalytics;
