import { useState } from 'react';
import { Plus, Search, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkModal } from './BookmarkModal';
import { bookmarks as initialBookmarks } from '../../data/mockData';

export const BookmarksView = () => {
  const { t } = useTranslation('bookmarks');
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [search, setSearch] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  const collections = ['all', ...new Set(initialBookmarks.map(b => b.collection))];

  const filtered = bookmarks.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.url.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCollection = collectionFilter === 'all' || b.collection === collectionFilter;
    return matchesSearch && matchesCollection;
  });

  const handleSave = (data) => {
    if (editingBookmark) {
      setBookmarks(bookmarks.map(b => b.id === editingBookmark.id ? { ...editingBookmark, ...data } : b));
    } else {
      setBookmarks([{ id: `bookmark-${Date.now()}`, ...data, favicon: null, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }, ...bookmarks]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{bookmarks.length} {t('bookmarksCount')}</p>
        </div>
        <button onClick={() => { setEditingBookmark(null); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createButton')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="input w-full pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {collections.map(col => (
            <button key={col} onClick={() => setCollectionFilter(col)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${collectionFilter === col ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {col === 'all' ? t('collections.all') : col}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('emptyDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={(bm) => { setEditingBookmark(bm); setIsModalOpen(true); }} onDelete={(id) => setBookmarks(bookmarks.filter(bm => bm.id !== id))} />
          ))}
        </div>
      )}

      <BookmarkModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} bookmark={editingBookmark} />
    </div>
  );
};
