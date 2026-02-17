import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NoteModal = ({ isOpen, onClose, onSave, note = null }) => {
  const { t } = useTranslation('notes');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'work',
    isPinned: false,
    tags: ''
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        category: note.category || 'work',
        isPinned: note.isPinned || false,
        tags: note.tags ? note.tags.join(', ') : ''
      });
    } else {
      setFormData({ title: '', content: '', category: 'work', isPinned: false, tags: '' });
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave({
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {note ? t('modal.edit') : t('modal.create')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.title')} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="input w-full"
              required
              placeholder={t('fields.titlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.content')}</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="input w-full h-32 resize-none"
              placeholder={t('fields.contentPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.category')}</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="input w-full"
              >
                <option value="work">{t('categories.work')}</option>
                <option value="personal">{t('categories.personal')}</option>
                <option value="ideas">{t('categories.ideas')}</option>
                <option value="archive">{t('categories.archive')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.tags')}</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({...formData, tags: e.target.value})}
                className="input w-full"
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={e => setFormData({...formData, isPinned: e.target.checked})}
              className="rounded"
            />
            <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">{t('fields.pin')}</label>
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
