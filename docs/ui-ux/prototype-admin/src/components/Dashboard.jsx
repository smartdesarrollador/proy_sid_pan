import { Users, Shield, TrendingUp, Activity, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { currentTenant, users, roles, auditLogs } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

function Dashboard() {
  const { currentUser } = useAuth();
  const { hasPermission, getPrimaryRole, isOrgAdmin } = usePermissions();

  const role = getPrimaryRole();
  const stats = [
    {
      label: 'Usuarios Activos',
      value: `${currentTenant.usage.users.current}/${currentTenant.usage.users.limit}`,
      change: '+3 este mes',
      icon: Users,
      color: 'bg-blue-500',
      percentage: (currentTenant.usage.users.current / currentTenant.usage.users.limit) * 100
    },
    {
      label: 'Roles Configurados',
      value: roles.length,
      change: '2 personalizados',
      icon: Shield,
      color: 'bg-purple-500',
      percentage: null
    },
    {
      label: 'Uso de Storage',
      value: `${currentTenant.usage.storage.current}GB`,
      change: `de ${currentTenant.usage.storage.limit}GB`,
      icon: Activity,
      color: 'bg-green-500',
      percentage: (currentTenant.usage.storage.current / currentTenant.usage.storage.limit) * 100
    },
    {
      label: 'API Calls',
      value: currentTenant.usage.apiCalls.current.toLocaleString(),
      change: `de ${currentTenant.usage.apiCalls.limit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      percentage: (currentTenant.usage.apiCalls.current / currentTenant.usage.apiCalls.limit) * 100
    }
  ];

  const recentUsers = users.slice(0, 5);
  const recentAudits = auditLogs.slice(0, 5);

  // Determinar qué stats mostrar según el rol
  const getVisibleStats = () => {
    if (isOrgAdmin() || role === 'Manager') {
      return stats; // Mostrar todas
    } else if (role === 'Member' || role === 'Content Editor') {
      return stats.slice(0, 2); // Solo usuarios y roles
    } else {
      return []; // Guest no ve stats
    }
  };

  const visibleStats = getVisibleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {isOrgAdmin() ? 'Resumen de tu organización' : `Bienvenido, ${currentUser?.firstName}`}
        </p>
        {!isOrgAdmin() && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Rol: <span className="font-semibold">{role}</span> - Vista limitada
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {visibleStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{stat.label}</p>

              {stat.percentage !== null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                    <span>{stat.change}</span>
                    <span>{Math.round(stat.percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`${stat.color} h-1.5 rounded-full transition-all`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {stat.percentage === null && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.change}</p>
              )}
            </div>
          );
        })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bienvenido al sistema</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Tu rol de <span className="font-semibold">{role}</span> tiene acceso limitado al dashboard.
          </p>
        </div>
      )}

      {/* Alerts - Solo para OrgAdmin y Manager */}
      {(isOrgAdmin() || role === 'Manager') && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                Límite de usuarios al 46%
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                Considera actualizar tu plan para agregar más usuarios
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                Suscripción activa
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Tu plan Professional se renueva el {currentTenant.subscription.currentPeriodEnd}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Recent Activity - Solo para usuarios con permisos */}
      {(hasPermission('users.read') || hasPermission('audit.read')) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users - Solo si tiene permiso users.read */}
        {hasPermission('users.read') && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usuarios Recientes</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
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
                  <div className="text-right">
                    <span className={`badge ${
                      user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {user.status === 'active' ? 'Activo' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Recent Audit Logs - Solo si tiene permiso audit.read */}
        {hasPermission('audit.read') && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentAudits.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-medium">{log.actor}</span> {log.details.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
}

export default Dashboard;
