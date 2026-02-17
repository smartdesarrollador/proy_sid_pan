import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ContactModal = ({ isOpen, onClose, onSave, contact = null }) => {
  const { t } = useTranslation('contacts');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', position: '', group: 'clients', notes: '', isFavorite: false
  });

  useEffect(() => {
    if (contact) {
      setFormData({ firstName: contact.firstName || '', lastName: contact.lastName || '', email: contact.email || '', phone: contact.phone || '', company: contact.company || '', position: contact.position || '', group: contact.group || 'clients', notes: contact.notes || '', isFavorite: contact.isFavorite || false });
    } else {
      setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', position: '', group: 'clients', notes: '', isFavorite: false });
    }
  }, [contact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{contact ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.firstName')} *</label>
              <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="input w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.lastName')}</label>
              <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.email')}</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.phone')}</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.company')}</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.position')}</label>
              <input type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.group')}</label>
            <select value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} className="input w-full">
              <option value="clients">{t('groups.clients')}</option>
              <option value="partners">{t('groups.partners')}</option>
              <option value="vendors">{t('groups.vendors')}</option>
              <option value="personal">{t('groups.personal')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.notes')}</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input w-full h-20 resize-none" />
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
