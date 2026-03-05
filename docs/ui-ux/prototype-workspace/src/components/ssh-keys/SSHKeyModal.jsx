import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SSHKeyModal = ({ isOpen, onClose, onSave, sshKey = null }) => {
  const { t } = useTranslation('sshKeys');
  const [formData, setFormData] = useState({ name: '', publicKey: '', algorithm: 'ED25519', description: '', expiresAt: '' });

  useEffect(() => {
    if (sshKey) {
      setFormData({ name: sshKey.name || '', publicKey: sshKey.publicKey || '', algorithm: sshKey.algorithm || 'ED25519', description: sshKey.description || '', expiresAt: sshKey.expiresAt || '' });
    } else {
      setFormData({ name: '', publicKey: '', algorithm: 'ED25519', description: '', expiresAt: '' });
    }
  }, [sshKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{sshKey ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.name')} *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input w-full" required placeholder="Mi Laptop" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.algorithm')}</label>
              <select value={formData.algorithm} onChange={e => setFormData({...formData, algorithm: e.target.value})} className="input w-full">
                <option value="ED25519">ED25519</option>
                <option value="RSA-4096">RSA-4096</option>
                <option value="RSA-2048">RSA-2048</option>
                <option value="ECDSA">ECDSA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.expiresAt')}</label>
              <input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.publicKey')}</label>
            <textarea value={formData.publicKey} onChange={e => setFormData({...formData, publicKey: e.target.value})} className="input w-full h-24 resize-none font-mono text-xs" placeholder="ssh-ed25519 AAAA..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.description')}</label>
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input w-full" />
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
