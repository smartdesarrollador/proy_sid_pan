import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SnippetModal = ({ isOpen, onClose, onSave, snippet = null }) => {
  const { t } = useTranslation('snippets');
  const [formData, setFormData] = useState({ title: '', language: 'javascript', description: '', code: '', tags: '', isFavorite: false });

  useEffect(() => {
    if (snippet) {
      setFormData({ title: snippet.title || '', language: snippet.language || 'javascript', description: snippet.description || '', code: snippet.code || '', tags: snippet.tags ? snippet.tags.join(', ') : '', isFavorite: snippet.isFavorite || false });
    } else {
      setFormData({ title: '', language: 'javascript', description: '', code: '', tags: '', isFavorite: false });
    }
  }, [snippet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) return;
    onSave({ ...formData, tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [] });
    onClose();
  };

  const languages = ['javascript', 'typescript', 'python', 'bash', 'sql', 'css', 'html', 'go', 'rust', 'java'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{snippet ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.title')} *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.language')}</label>
              <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="input w-full">
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.description')}</label>
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.code')} *</label>
            <textarea value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="input w-full h-48 resize-none font-mono text-sm" required placeholder="// Codigo aqui..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.tags')}</label>
            <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="input w-full" placeholder="tag1, tag2" />
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
