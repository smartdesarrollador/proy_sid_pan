import { ExternalLink, Star, Edit2, Trash2, Bookmark } from 'lucide-react';

export const BookmarkCard = ({ bookmark, onEdit, onDelete }) => {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <Bookmark className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1 flex items-center gap-1">
              {bookmark.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
            </a>
            {bookmark.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>
          {bookmark.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{bookmark.description}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{bookmark.url}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {bookmark.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">#{tag}</span>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(bookmark)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={() => onDelete(bookmark.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <span className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full">{bookmark.collection}</span>
      </div>
    </div>
  );
};
