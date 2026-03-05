import { useState } from 'react';
import { Plus, Search, Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SnippetCard } from './SnippetCard';
import { SnippetModal } from './SnippetModal';
import { snippets as initialSnippets } from '../../data/mockData';

export const SnippetsView = () => {
  const { t } = useTranslation('snippets');
  const [snippets, setSnippets] = useState(initialSnippets);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);

  const languages = ['all', ...new Set(initialSnippets.map(s => s.language))];

  const filtered = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
    const matchesLang = langFilter === 'all' || s.language === langFilter;
    return matchesSearch && matchesLang;
  });

  const handleSave = (data) => {
    if (editingSnippet) {
      setSnippets(snippets.map(s => s.id === editingSnippet.id ? { ...editingSnippet, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s));
    } else {
      setSnippets([{ id: `snippet-${Date.now()}`, ...data, languageColor: '#f7df1e', createdBy: 'user-001', createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }, ...snippets]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{snippets.length} {t('snippetsCount')}</p>
        </div>
        <button onClick={() => { setEditingSnippet(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input w-full pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {languages.map(lang => (
            <button key={lang} onClick={() => setLangFilter(lang)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${langFilter === lang ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {lang === 'all' ? t('languages.all') : lang}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Code2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <SnippetCard key={s.id} snippet={s} onEdit={(sn) => { setEditingSnippet(sn); setIsModalOpen(true); }} onDelete={(id) => setSnippets(snippets.filter(sn => sn.id !== id))} />
          ))}
        </div>
      )}

      <SnippetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} snippet={editingSnippet} />
    </div>
  );
};
