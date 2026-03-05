import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FormModal = ({ isOpen, onClose, onSave, form = null }) => {
  const { t } = useTranslation('forms');
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'draft', closesAt: '',
    questions: []
  });

  useEffect(() => {
    if (form) {
      setFormData({ title: form.title || '', description: form.description || '', status: form.status || 'draft', closesAt: form.closesAt || '', questions: form.questions ? [...form.questions] : [] });
    } else {
      setFormData({ title: '', description: '', status: 'draft', closesAt: '', questions: [] });
    }
  }, [form, isOpen]);

  if (!isOpen) return null;

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { id: `q-new-${Date.now()}`, type: 'text', text: '', required: false }]
    }));
  };

  const updateQuestion = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q)
    }));
  };

  const removeQuestion = (idx) => {
    setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{form ? t('modal.edit') : t('modal.create')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.title')} *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.description')}</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input w-full h-20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.status')}</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input w-full">
                <option value="draft">{t('status.draft')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="closed">{t('status.closed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fields.closesAt')}</label>
              <input type="date" value={formData.closesAt} onChange={e => setFormData({...formData, closesAt: e.target.value})} className="input w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('fields.questions')}</label>
              <button type="button" onClick={addQuestion} className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline">
                <Plus className="w-3.5 h-3.5" />{t('addQuestion')}
              </button>
            </div>
            <div className="space-y-2">
              {formData.questions.map((q, idx) => (
                <div key={q.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input type="text" value={q.text} onChange={e => updateQuestion(idx, 'text', e.target.value)} className="input flex-1 text-sm" placeholder={t('questionPlaceholder')} />
                  <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)} className="input text-sm w-28">
                    <option value="text">Texto</option>
                    <option value="rating">Rating</option>
                    <option value="multiple_choice">Opcion</option>
                    <option value="boolean">Si/No</option>
                  </select>
                  <button type="button" onClick={() => removeQuestion(idx)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
              {formData.questions.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">{t('noQuestions')}</p>
              )}
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
