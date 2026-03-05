import { useState } from 'react';
import { Plus, Search, FileText, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteCard } from './NoteCard';
import { NoteModal } from './NoteModal';
import { notes as initialNotes } from '../../data/mockData';
import { useFeatureGate } from '../../hooks/useFeatureGate';

export const NotesView = () => {
  const { t } = useTranslation('notes');
  const { canPerformAction, getUpgradeMessage } = useFeatureGate();
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const categories = ['all', 'work', 'personal', 'ideas', 'archive'];

  const filtered = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const pinned = filtered.filter(n => n.isPinned);
  const unpinned = filtered.filter(n => !n.isPinned);

  const handleCreate = () => {
    if (!canPerformAction('maxNotes', notes.length)) {
      const msg = getUpgradeMessage('maxNotes');
      alert(msg?.message || 'Límite de notas alcanzado');
      return;
    }
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleSave = (data) => {
    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...editingNote, ...data, updatedAt: new Date().toISOString().split('T')[0] } : n));
    } else {
      const newNote = {
        id: `note-${Date.now()}`,
        ...data,
        createdBy: 'user-001',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        color: '#3b82f6'
      };
      setNotes([newNote, ...notes]);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm(t('confirmDelete'))) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notes.length} {t('notesCount')}</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('createButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input w-full pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat === 'all' ? t('categories.all') : t(`categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4 text-yellow-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('pinnedSection')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map(note => (
              <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 ? (
        <div>
          {pinned.length > 0 && (
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">{t('otherNotes')}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinned.map(note => (
              <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ) : (
        filtered.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('emptyDescription')}</p>
          </div>
        )
      )}

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        note={editingNote}
      />
    </div>
  );
};
