import { Star, Copy, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

const LANG_COLORS = {
  javascript: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  python: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  bash: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  sql: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  css: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  typescript: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  go: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
};

export const SnippetCard = ({ snippet, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langColorClass = LANG_COLORS[snippet.language] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{snippet.title}</h3>
            {snippet.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>
          <span className={`inline-block text-xs px-2 py-0.5 rounded font-mono font-medium mt-1 ${langColorClass}`}>
            {snippet.language}
          </span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={handleCopy} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Copy code">
            {copied ? <span className="text-xs text-green-600 font-medium">&#10003;</span> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
          </button>
          <button onClick={() => onEdit(snippet)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={() => onDelete(snippet.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {snippet.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{snippet.description}</p>
      )}

      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs rounded-lg p-3 overflow-hidden max-h-28 overflow-y-auto font-mono leading-relaxed">
        <code>{snippet.code.slice(0, 300)}{snippet.code.length > 300 ? '...' : ''}</code>
      </pre>

      {snippet.tags && snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {snippet.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs text-gray-500 dark:text-gray-400">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};
