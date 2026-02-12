import { useState } from 'react';
import {
  CreditCard,
  Check,
  X,
  Calendar,
  Download,
  AlertCircle,
  TrendingUp,
  Database,
  Zap,
  Users,
  Lock
} from 'lucide-react';
import { subscriptionPlans, currentTenant, invoices } from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';

function SubscriptionManagement() {
  const { canManageBilling, canUpgradePlan } = usePermissions();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const currentPlan = subscriptionPlans.find(p => p.name.toLowerCase() === currentTenant.subscription.plan);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suscripción y Facturación</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Gestiona tu plan y métodos de pago
          {!canManageBilling() && <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-medium">(Solo lectura)</span>}
        </p>
      </div>

      {/* Restricted Access Warning */}
      {!canManageBilling() && (
        <div className="card p-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Acceso limitado
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                No tienes permisos para modificar la suscripción. Solo puedes ver la información.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Status */}
      <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-100 text-sm mb-1">Plan Actual</p>
            <h2 className="text-2xl font-bold mb-2">{currentPlan?.displayName}</h2>
            <p className="text-primary-100 text-sm">
              Se renueva el {currentTenant.subscription.currentPeriodEnd}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${currentPlan?.priceMonthly}</p>
            <p className="text-primary-100 text-sm">/mes</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" />
              <p className="text-xs text-primary-100">Usuarios</p>
            </div>
            <p className="text-lg font-semibold">
              {currentTenant.usage.users.current}/{currentTenant.usage.users.limit}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4" />
              <p className="text-xs text-primary-100">Storage</p>
            </div>
            <p className="text-lg font-semibold">
              {currentTenant.usage.storage.current}/{currentTenant.usage.storage.limit}GB
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" />
              <p className="text-xs text-primary-100">API Calls</p>
            </div>
            <p className="text-lg font-semibold">
              {(currentTenant.usage.apiCalls.current / 1000).toFixed(1)}k
            </p>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comparar Planes</h3>
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Anual
              <span className="ml-2 text-xs badge bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">-10%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionPlans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            const isCurrentPlan = plan.name.toLowerCase() === currentTenant.subscription.plan;

            return (
              <div
                key={plan.id}
                className={`card relative ${
                  plan.popular ? 'ring-2 ring-primary-500' : ''
                } ${isCurrentPlan ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-primary-600 text-white">Más Popular</span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-green-600 text-white">Plan Actual</span>
                  </div>
                )}

                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{plan.displayName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    {price !== null ? (
                      <>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          ${price}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          /{billingCycle === 'monthly' ? 'mes' : 'año'}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">Personalizado</p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={isCurrentPlan || !canUpgradePlan()}
                    className={`w-full btn ${
                      isCurrentPlan || !canUpgradePlan()
                        ? 'btn-secondary cursor-not-allowed opacity-50'
                        : plan.popular
                        ? 'btn-primary'
                        : 'btn-ghost border border-gray-300 dark:border-gray-700'
                    }`}
                    title={!canUpgradePlan() ? 'Sin permisos para actualizar plan' : ''}
                  >
                    {isCurrentPlan
                      ? 'Plan Actual'
                      : !canUpgradePlan()
                      ? 'Sin Permisos'
                      : price === null
                      ? 'Contactar Ventas'
                      : 'Actualizar Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-300 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                Alcanzando límite de usuarios
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                {currentTenant.usage.users.current} de {currentTenant.usage.users.limit} usuarios utilizados
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Uso de API saludable
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                {((currentTenant.usage.apiCalls.current / currentTenant.usage.apiCalls.limit) * 100).toFixed(1)}% de tu límite mensual
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Facturas</h3>
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Ver todas
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.periodStart} - {invoice.periodEnd}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${invoice.amount.toFixed(2)} {invoice.currency}
                    </p>
                    <span className="badge bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs">
                      Pagado
                    </span>
                  </div>

                  <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
