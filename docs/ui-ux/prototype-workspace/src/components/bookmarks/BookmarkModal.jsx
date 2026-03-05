import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BookmarkModal = ({ isOpen, onClose, onSave, bookmark = null }) => {
  const { t } = useTranslation('bookmarks');
  const [formData, setFormData] = useState({ title: '', url: '', description: '', collection: 'dev-resources', tags: '', isFavorite: false });

  useEffect(() => {
    if (bookmark) {
      setFormData({ title: bookmark.title || '', url: bookmark.url || '', description: bookmark.description || '', collection: bookmark.collection || 'dev-resources', tags: bookmark.tags ? bookmark.tags.join(', ') : '', isFavorite: bookmark.isFavorite || false });
    } else {
      setFormData({ title: '', url: '', description: '', collection: 'dev-resources', tags: '', isFavorite: false });
    }
  }, [bookmark, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.url.trim()) return;
    onSave({ ...formData, tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{bookmark ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.url')} *</label>
            <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="input w-full" required placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.title')}</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input w-full" placeholder={t('fields.titlePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.description')}</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input w-full h-20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.collection')}</label>
              <input type="text" value={formData.collection} onChange={e => setFormData({...formData, collection: e.target.value})} className="input w-full" placeholder="dev-resources" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.tags')}</label>
              <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="input w-full" placeholder="tag1, tag2" />
            </div>
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
