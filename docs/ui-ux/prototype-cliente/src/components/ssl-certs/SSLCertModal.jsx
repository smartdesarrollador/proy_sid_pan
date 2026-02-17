import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SSLCertModal = ({ isOpen, onClose, onSave, cert = null }) => {
  const { t } = useTranslation('sslCerts');
  const [formData, setFormData] = useState({ domain: '', issuer: '', validFrom: '', validUntil: '', autoRenew: false, notes: '' });

  useEffect(() => {
    if (cert) {
      setFormData({ domain: cert.domain || '', issuer: cert.issuer || '', validFrom: cert.validFrom || '', validUntil: cert.validUntil || '', autoRenew: cert.autoRenew || false, notes: cert.notes || '' });
    } else {
      setFormData({ domain: '', issuer: '', validFrom: '', validUntil: '', autoRenew: false, notes: '' });
    }
  }, [cert, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.domain.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{cert ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.domain')} *</label>
            <input type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="input w-full font-mono" required placeholder="example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.issuer')}</label>
            <input type="text" value={formData.issuer} onChange={e => setFormData({...formData, issuer: e.target.value})} className="input w-full" placeholder="Let's Encrypt" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.validFrom')}</label>
              <input type="date" value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.validUntil')}</label>
              <input type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.notes')}</label>
            <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input w-full" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoRenew" checked={formData.autoRenew} onChange={e => setFormData({...formData, autoRenew: e.target.checked})} className="rounded" />
            <label htmlFor="autoRenew" className="text-sm text-gray-700 dark:text-gray-300">{t('fields.autoRenew')}</label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">{t('modal.cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('modal.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
