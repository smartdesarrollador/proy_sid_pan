import { useState } from 'react';
import { Plus, Shield, RefreshCw, Edit2, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SSLCertModal } from './SSLCertModal';
import { sslCerts as initialSSLCerts, getSSLCertStatusColor } from '../../data/mockData';

const StatusIcon = ({ status }) => {
  if (status === 'expired') return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === 'expiring') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <CheckCircle className="w-4 h-4 text-green-500" />;
};

export const SSLCertsView = () => {
  const { t } = useTranslation('sslCerts');
  const [certs, setCerts] = useState(initialSSLCerts);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);

  const filtered = certs.filter(c => {
    const certStatus = getSSLCertStatusColor(c);
    return statusFilter === 'all' || certStatus.status === statusFilter;
  });

  const handleSave = (data) => {
    const newCert = { ...data };
    const today = new Date();
    const validUntil = new Date(data.validUntil);
    const daysLeft = Math.floor((validUntil - today) / (1000 * 60 * 60 * 24));
    newCert.status = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'valid';

    if (editingCert) {
      setCerts(certs.map(c => c.id === editingCert.id ? { ...editingCert, ...newCert } : c));
    } else {
      setCerts([{ id: `ssl-${Date.now()}`, ...newCert, san: [], createdBy: 'user-001', updatedAt: new Date().toISOString().split('T')[0] }, ...certs]);
    }
  };

  const expiredCount = certs.filter(c => getSSLCertStatusColor(c).status === 'expired').length;
  const expiringCount = certs.filter(c => getSSLCertStatusColor(c).status === 'expiring').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{certs.length} {t('certsCount')}</p>
        </div>
        <button onClick={() => { setEditingCert(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="mb-6 space-y-2">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {expiredCount} {t('alerts.expired')}
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {expiringCount} {t('alerts.expiring')}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {['all', 'valid', 'expiring', 'expired'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {t(`status.${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((cert, i) => {
            const statusInfo = getSSLCertStatusColor(cert);
            return (
              <div key={cert.id} className={`p-4 ${i < filtered.length - 1 ? 'border-b dark:border-gray-700' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon status={statusInfo.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm font-mono">{cert.domain}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bg} ${statusInfo.text}`}>{statusInfo.label}</span>
                        {cert.autoRenew && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> {t('autoRenew')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{t('fields.issuer')}: {cert.issuer}</span>
                        <span>{t('fields.validUntil')}: {cert.validUntil}</span>
                      </div>
                      {cert.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cert.notes}</p>}
                      {cert.san && cert.san.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {cert.san.map(s => (
                            <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded font-mono">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditingCert(cert); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => { if(confirm(t('confirmDelete'))) setCerts(certs.filter(c => c.id !== cert.id)); }} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SSLCertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} cert={editingCert} />
    </div>
  );
};
