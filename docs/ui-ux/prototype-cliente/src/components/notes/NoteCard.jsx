import { Pin, Tag, Edit2, Trash2 } from 'lucide-react';

export const NoteCard = ({ note, onEdit, onDelete }) => {
  const categoryColors = {
    work: 'border-blue-400',
    personal: 'border-green-400',
    ideas: 'border-yellow-400',
    archive: 'border-gray-400'
  };

  const categoryBadgeColors = {
    work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    personal: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    ideas: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    archive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  };

  return (
    <div className={`card p-4 border-l-4 ${categoryColors[note.category] || 'border-gray-400'} hover:shadow-md transition-shadow relative`}>
      {note.isPinned && (
        <Pin className="absolute top-3 right-3 w-4 h-4 text-yellow-500 fill-yellow-500" />
      )}
      <div className="flex items-start gap-2 mb-2 pr-6">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">{note.title}</h3>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">{note.content}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryBadgeColors[note.category]}`}>
          {note.category}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(note)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={() => onDelete(note.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-gray-500 dark:text-gray-400">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};
