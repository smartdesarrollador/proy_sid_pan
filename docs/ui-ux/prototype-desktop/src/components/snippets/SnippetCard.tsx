import { Star, Copy, Pencil, Trash2 } from "lucide-react";
import type { Snippet } from "../../data/mockSnippets";
import { LANGUAGE_LABELS, LANGUAGE_COLORS } from "../../data/mockSnippets";

interface SnippetCardProps {
  snippet: Snippet;
  onCopy: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function SnippetCard({
  snippet,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
}: SnippetCardProps) {
  return (
    <div className="group rounded-lg border border-gray-700 bg-[#1a1a2e] p-3 transition-colors hover:border-gray-600">
      {/* Title + favorite + hover actions */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <button
            onClick={() => onToggleFavorite(snippet.id)}
            className="mt-0.5 shrink-0"
          >
            <Star
              size={14}
              className={
                snippet.isFavorite
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-500 hover:text-yellow-400"
              }
            />
          </button>
          <h3 className="text-sm font-medium leading-snug text-gray-200 truncate">
            {snippet.title}
          </h3>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onCopy(snippet.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onEdit(snippet.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(snippet.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-900/50 hover:text-red-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Language badge */}
      <div className="mb-2">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${LANGUAGE_COLORS[snippet.language]}`}
        >
          {LANGUAGE_LABELS[snippet.language]}
        </span>
      </div>

      {/* Description */}
      <p className="mb-2 text-xs leading-relaxed text-gray-400 line-clamp-2">
        {snippet.description}
      </p>

      {/* Code preview */}
      <div className="mb-2 overflow-hidden rounded bg-[#0d0d1a] p-2">
        <pre className="font-mono text-[11px] leading-relaxed text-gray-300 line-clamp-4">
          {snippet.code}
        </pre>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {snippet.tags.map((tag) => (
          <span key={tag} className="text-[11px] text-gray-500">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
