import { useState } from 'react';
import { Plus, Search, Terminal, Eye, EyeOff, Copy, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EnvVarModal } from './EnvVarModal';
import { envVars as initialEnvVars } from '../../data/mockData';
import { useFeatureGate } from '../../hooks/useFeatureGate';

const ENV_COLORS = {
  development: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  staging: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  production: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
};

const EnvVarRow = ({ envVar, onEdit, onDelete, canReveal }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(envVar.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 border-b dark:border-gray-700 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{envVar.key}</code>
          {envVar.isSecret && (
            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded">secret</span>
          )}
        </div>
        {envVar.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{envVar.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0 max-w-xs">
        {envVar.isSecret ? (
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {revealed ? 'valor_revelado_aqui' : '••••••••••••••••'}
            </code>
            {canReveal && (
              <button onClick={() => setRevealed(!revealed)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                {revealed ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
              </button>
            )}
          </div>
        ) : (
          <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{envVar.maskedValue}</code>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ENV_COLORS[envVar.environment]}`}>
        {envVar.environment}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={handleCopy} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Copiar key">
          {copied ? <span className="text-xs text-green-600">&#10003;</span> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
        </button>
        <button onClick={() => onEdit(envVar)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button onClick={() => onDelete(envVar.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
};

export const EnvVarsView = () => {
  const { t } = useTranslation('envVars');
  const { hasFeature } = useFeatureGate();
  const [envVars, setEnvVars] = useState(initialEnvVars);
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVar, setEditingVar] = useState(null);

  const isEnabled = hasFeature('envVarsEnabled');

  const filtered = envVars.filter(v => {
    const matchesSearch = v.key.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    const matchesEnv = envFilter === 'all' || v.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

  const grouped = {
    production: filtered.filter(v => v.environment === 'production'),
    staging: filtered.filter(v => v.environment === 'staging'),
    development: filtered.filter(v => v.environment === 'development')
  };

  const handleSave = (data) => {
    if (editingVar) {
      setEnvVars(envVars.map(v => v.id === editingVar.id ? { ...editingVar, ...data, updatedAt: new Date().toISOString().split('T')[0] } : v));
    } else {
      setEnvVars([{ id: `env-${Date.now()}`, ...data, maskedValue: data.isSecret ? '••••••••••••••••' : data.value, createdBy: 'user-001', updatedAt: new Date().toISOString().split('T')[0] }, ...envVars]);
    }
  };

  if (!isEnabled) {
    return (
      <div className="text-center py-20">
        <Terminal className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('upgradeTitle')}</h3>
        <p className="text-gray-600 dark:text-gray-400">{t('upgradeDescription')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{envVars.length} {t('varsCount')}</p>
        </div>
        <button onClick={() => { setEditingVar(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input w-full pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'production', 'staging', 'development'].map(env => (
            <button key={env} onClick={() => setEnvFilter(env)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${envFilter === env ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {env === 'all' ? t('environments.all') : t(`environments.${env}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([env, vars]) => {
          if (vars.length === 0) return null;
          return (
            <div key={env} className="card overflow-hidden">
              <div className={`px-4 py-2 border-b dark:border-gray-700 ${env === 'production' ? 'bg-red-50 dark:bg-red-900/10' : env === 'staging' ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${ENV_COLORS[env]}`}>{t(`environments.${env}`)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{vars.length} {t('varsCount')}</span>
                </div>
              </div>
              {vars.map(v => (
                <EnvVarRow key={v.id} envVar={v} onEdit={(ev) => { setEditingVar(ev); setIsModalOpen(true); }} onDelete={(id) => setEnvVars(envVars.filter(ev => ev.id !== id))} canReveal={true} />
              ))}
            </div>
          );
        })}
      </div>

      <EnvVarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} envVar={editingVar} />
    </div>
  );
};
