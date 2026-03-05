import { useState } from 'react';
import { Plus, Key, Copy, Edit2, Trash2, Search, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SSHKeyModal } from './SSHKeyModal';
import { sshKeys as initialSSHKeys } from '../../data/mockData';

export const SSHKeysView = () => {
  const { t } = useTranslation('sshKeys');
  const [sshKeys, setSSHKeys] = useState(initialSSHKeys);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = sshKeys.filter(k => k.name.toLowerCase().includes(search.toLowerCase()) || k.algorithm.toLowerCase().includes(search.toLowerCase()));

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key.publicKey);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (data) => {
    if (editingKey) {
      setSSHKeys(sshKeys.map(k => k.id === editingKey.id ? { ...editingKey, ...data } : k));
    } else {
      setSSHKeys([{ id: `ssh-${Date.now()}`, ...data, fingerprint: 'SHA256:nuevo...', createdAt: new Date().toISOString().split('T')[0], lastUsed: null, createdBy: 'user-001' }, ...sshKeys]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sshKeys.length} {t('keysCount')}</p>
        </div>
        <button onClick={() => { setEditingKey(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input w-full pl-9 max-w-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Key className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((key, i) => (
            <div key={key.id} className={`p-4 ${i < filtered.length - 1 ? 'border-b dark:border-gray-700' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{key.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded font-mono">{key.algorithm}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 truncate">{key.fingerprint}</p>
                    {key.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{key.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{t('fields.created')}: {key.createdAt}</span>
                      {key.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{t('fields.expires')}: {key.expiresAt}
                        </span>
                      )}
                      {key.lastUsed && <span>{t('fields.lastUsed')}: {key.lastUsed}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleCopy(key)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={t('actions.copy')}>
                    {copiedId === key.id ? <span className="text-xs text-green-600">&#10003;</span> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                  <button onClick={() => { setEditingKey(key); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => { if(confirm(t('confirmDelete'))) setSSHKeys(sshKeys.filter(k => k.id !== key.id)); }} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SSHKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} sshKey={editingKey} />
    </div>
  );
};
