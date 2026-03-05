import { useState } from 'react';
import { Activity, Search, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { auditLogs } from '../../data/mockData';
import { useFeatureGate } from '../../hooks/useFeatureGate';

const ACTION_STYLES = {
  assign_role: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  create_role: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  update_user: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  upgrade_plan: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  login_failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  delete_user: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  create_project: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  share_element: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
};

export const AuditLogView = () => {
  const { t } = useTranslation('auditLog');
  const { hasFeature } = useFeatureGate();
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const isEnabled = hasFeature('auditLogEnabled');

  const uniqueActors = ['all', ...new Set(auditLogs.map(l => l.actor))];

  const filtered = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesActor = actorFilter === 'all' || log.actor === actorFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesActor && matchesStatus;
  });

  if (!isEnabled) {
    return (
      <div className="text-center py-20">
        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('upgradeTitle')}</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t('upgradeDescription')}</p>
        <div className="mt-4 text-sm text-primary-600 dark:text-primary-400 font-medium">
          {t('upgradeRequired')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{filtered.length} {t('eventsCount')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5" />
          {t('readOnly')}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input w-full pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={actorFilter} onChange={e => setActorFilter(e.target.value)} className="input text-sm">
            {uniqueActors.map(a => <option key={a} value={a}>{a === 'all' ? t('filters.allActors') : a}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input text-sm">
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="success">{t('filters.success')}</option>
            <option value="failed">{t('filters.failed')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((log, i) => (
            <div key={log.id} className={`flex items-start gap-4 p-4 ${i < filtered.length - 1 ? 'border-b dark:border-gray-700' : ''}`}>
              <div className="flex-shrink-0 mt-0.5">
                {log.status === 'success'
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <XCircle className="w-5 h-5 text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {log.action}
                  </span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{log.actor}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{log.resource}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.details}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{log.timestamp}</span>
                  <span className="font-mono">{log.ipAddress}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
