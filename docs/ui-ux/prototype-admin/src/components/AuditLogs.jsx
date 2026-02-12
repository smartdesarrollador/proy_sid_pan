import { useState } from 'react';
import { Search, Filter, Download, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { auditLogs as mockAuditLogs } from '../data/mockData';

function AuditLogs() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const actions = ['all', ...new Set(mockAuditLogs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const getActionLabel = (action) => {
    const labels = {
      'assign_role': 'Asignar Rol',
      'create_role': 'Crear Rol',
      'update_user': 'Actualizar Usuario',
      'upgrade_plan': 'Actualizar Plan',
      'login_failed': 'Login Fallido',
      'login': 'Login',
      'logout': 'Logout',
      'create_user': 'Crear Usuario',
      'delete_user': 'Eliminar Usuario'
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    if (action.includes('create')) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (action.includes('delete')) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (action.includes('update') || action.includes('assign')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    if (action.includes('login')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoría y Compliance</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {logs.length} eventos registrados • Logs inmutables con retención de 7 años
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Info Banner */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Sistema de auditoría completo
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Todos los cambios en roles, permisos, usuarios y suscripciones quedan registrados de forma inmutable.
              Cumplimiento con SOC2 Type II y GDPR.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todas las acciones</option>
            {actions.filter(a => a !== 'all').map(action => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="success">Exitosos</option>
            <option value="failed">Fallidos</option>
          </select>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cronología de Eventos</h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredLogs.map((log, index) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start gap-4">
                {/* Timeline indicator */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    log.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {log.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  {index !== filteredLogs.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className={`badge ${
                          log.status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {log.status === 'success' ? 'Exitoso' : 'Fallido'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        <span className="text-primary-600 dark:text-primary-400">{log.actor}</span> {log.details.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recurso: {log.resource}
                      </p>
                    </div>

                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        {log.timestamp}
                      </div>
                      <p>IP: {log.ipAddress}</p>
                    </div>
                  </div>

                  {/* Expandable details */}
                  <details className="mt-3">
                    <summary className="text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:text-primary-700 dark:hover:text-primary-300">
                      Ver detalles técnicos
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">ID del Evento</p>
                          <p className="text-gray-900 dark:text-white font-mono">{log.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Dirección IP</p>
                          <p className="text-gray-900 dark:text-white font-mono">{log.ipAddress}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">User Agent</p>
                          <p className="text-gray-900 dark:text-white text-xs">
                            Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
                          </p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron eventos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(l => l.status === 'success').length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Eventos exitosos</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.filter(l => l.status === 'failed').length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Eventos fallidos</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">24h</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Últimas 24 horas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
