import { useState } from 'react';
import {
  Download,
  CreditCard,
  Building2,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  DollarSign,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { invoices, paymentMethods, billingTransactions } from '../data/mockData';
import { usePermissions } from '../hooks/usePermissions';

// ===========================
// Sub-componente: StatusBadge
// ===========================
function StatusBadge({ status }) {
  const config = {
    paid:    { label: 'Pagada',   icon: CheckCircle, class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    pending: { label: 'Pendiente', icon: Clock,       class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    failed:  { label: 'Fallida',   icon: XCircle,     class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const { label, icon: Icon, class: cls } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ===========================
// Sub-componente: PaymentMethodCard
// ===========================
function PaymentMethodCard({ method }) {
  const isCard = method.type === 'card';
  const Icon = isCard ? CreditCard : Building2;

  const brandColors = {
    Visa:       'bg-blue-600',
    Mastercard: 'bg-red-600',
    Amex:       'bg-green-600',
    'Bank Transfer': 'bg-gray-600',
  };
  const brandColor = brandColors[method.brand] || 'bg-gray-600';

  return (
    <div className={`relative p-5 rounded-xl border-2 transition-colors ${
      method.isDefault
        ? 'border-primary-300 dark:border-primary-600 bg-primary-50/40 dark:bg-primary-900/10'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {method.isDefault && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <Star className="w-3 h-3" />
          Principal
        </span>
      )}

      <div className={`w-10 h-10 ${brandColor} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {method.brand}
        {isCard && ` •••• ${method.last4}`}
        {!isCard && ` •••• ${method.last4}`}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {isCard ? `Vence ${method.expiry}` : method.bankName}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{method.holderName}</p>
    </div>
  );
}

// ===========================
// Componente principal
// ===========================
function Billing() {
  const { canManageBilling } = usePermissions();
  const [downloadingId, setDownloadingId] = useState(null);

  const totalPaid = billingTransactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = billingTransactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const nextInvoice = billingTransactions.find((t) => t.status === 'pending');

  const handleDownload = (id) => {
    setDownloadingId(id);
    setTimeout(() => setDownloadingId(null), 1200);
  };

  const handleDownloadAll = () => {
    setDownloadingId('all');
    setTimeout(() => setDownloadingId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historial financiero y métodos de pago
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloadingId === 'all'}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloadingId === 'all' ? 'Descargando...' : 'Descargar todas'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${totalPaid.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total facturado</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${totalPending.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pendiente de cobro</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {nextInvoice ? `$${nextInvoice.amount.toFixed(2)}` : '—'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Próxima factura
                {nextInvoice && (
                  <span className="block text-xs text-gray-400 dark:text-gray-500">
                    {new Date(nextInvoice.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métodos de Pago */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Métodos de Pago
            </h3>
          </div>
          {canManageBilling() && (
            <button className="btn-primary flex items-center gap-2 text-sm py-1.5">
              <Plus className="w-4 h-4" />
              Agregar método
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
        </div>
      </div>

      {/* Historial de Facturas */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Facturas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium"># Factura</th>
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Período</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Monto</th>
                <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 font-mono text-gray-700 dark:text-gray-300">{inv.invoiceNumber}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {new Date(inv.periodStart).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    {' – '}
                    {new Date(inv.periodEnd).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="py-3 text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => handleDownload(inv.id)}
                      disabled={downloadingId === inv.id}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium"
                    >
                      {downloadingId === inv.id ? 'Descargando...' : 'PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transacciones Recientes
          </h3>
        </div>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />
          <div className="space-y-4 pl-12">
            {billingTransactions.map((txn) => (
              <div key={txn.id} className="relative">
                <div className={`absolute -left-7 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                  txn.status === 'paid'    ? 'bg-green-500' :
                  txn.status === 'pending' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {txn.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(txn.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${txn.amount.toFixed(2)}
                    </p>
                    <StatusBadge status={txn.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
