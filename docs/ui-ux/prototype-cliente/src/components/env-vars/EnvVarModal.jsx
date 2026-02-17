import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const EnvVarModal = ({ isOpen, onClose, onSave, envVar = null }) => {
  const { t } = useTranslation('envVars');
  const [formData, setFormData] = useState({ key: '', value: '', environment: 'development', description: '', isSecret: false });

  useEffect(() => {
    if (envVar) {
      setFormData({ key: envVar.key || '', value: '', environment: envVar.environment || 'development', description: envVar.description || '', isSecret: envVar.isSecret || false });
    } else {
      setFormData({ key: '', value: '', environment: 'development', description: '', isSecret: false });
    }
  }, [envVar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.key.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{envVar ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.key')} *</label>
            <input type="text" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value.toUpperCase().replace(/\s/g, '_')})} className="input w-full font-mono" required placeholder="MY_API_KEY" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.value')}</label>
            <input type={formData.isSecret ? 'password' : 'text'} value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="input w-full font-mono" placeholder={t('fields.valuePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.environment')}</label>
            <select value={formData.environment} onChange={e => setFormData({...formData, environment: e.target.value})} className="input w-full">
              <option value="development">{t('environments.development')}</option>
              <option value="staging">{t('environments.staging')}</option>
              <option value="production">{t('environments.production')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.description')}</label>
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input w-full" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isSecret" checked={formData.isSecret} onChange={e => setFormData({...formData, isSecret: e.target.checked})} className="rounded" />
            <label htmlFor="isSecret" className="text-sm text-gray-700 dark:text-gray-300">{t('fields.isSecret')}</label>
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
