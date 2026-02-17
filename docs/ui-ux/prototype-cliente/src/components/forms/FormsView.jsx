import { useState } from 'react';
import { Plus, ClipboardList, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FormModal } from './FormModal';
import { forms as initialForms } from '../../data/mockData';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
};

export const FormsView = () => {
  const { t } = useTranslation('forms');
  const [forms, setForms] = useState(initialForms);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);

  const filtered = forms.filter(f => statusFilter === 'all' || f.status === statusFilter);

  const handleSave = (data) => {
    if (editingForm) {
      setForms(forms.map(f => f.id === editingForm.id ? { ...editingForm, ...data, updatedAt: new Date().toISOString().split('T')[0] } : f));
    } else {
      setForms([{ id: `form-${Date.now()}`, ...data, responsesCount: 0, maxResponses: null, createdBy: 'user-001', createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }, ...forms]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{forms.length} {t('formsCount')}</p>
        </div>
        <button onClick={() => { setEditingForm(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'active', 'draft', 'closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {s === 'all' ? t('status.all') : t(`status.${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(form => (
            <div key={form.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{form.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[form.status]}`}>
                      {t(`status.${form.status}`)}
                    </span>
                  </div>
                  {form.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{form.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {form.responsesCount} {t('responses')}
                    </span>
                    <span>{form.questions.length} {t('questions')}</span>
                    {form.closesAt && <span>{t('fields.closesAt')}: {form.closesAt}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingForm(form); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => { if(confirm(t('confirmDelete'))) setForms(forms.filter(f => f.id !== form.id)); }} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} form={editingForm} />
    </div>
  );
};
