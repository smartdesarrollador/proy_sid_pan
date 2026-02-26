import { Pencil, Trash2, Star, ExternalLink, Bookmark } from "lucide-react";
import type { Bookmark as BookmarkType } from "../../data/mockBookmarks";
import { COLLECTION_COLORS, COLLECTION_LABELS } from "../../data/mockBookmarks";

interface BookmarkCardProps {
  bookmark: BookmarkType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onEdit, onDelete, onToggleFavorite }: BookmarkCardProps) {
  const colors = COLLECTION_COLORS[bookmark.collection];
  const visibleTags = bookmark.tags.slice(0, 3);

  // Extract display URL (remove protocol)
  const displayUrl = bookmark.url.replace(/^https?:\/\//, "");

  return (
    <div
      className={`group rounded-lg border border-gray-700 border-l-4 ${colors.border} bg-[#1a1a2e] p-3 transition-colors hover:border-gray-600`}
    >
      {/* Title + favorite + hover actions */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium leading-snug text-gray-200 hover:text-blue-400"
        >
          <Bookmark size={13} className="shrink-0 text-gray-400" />
          <span className="line-clamp-2">{bookmark.title}</span>
          <ExternalLink size={11} className="shrink-0 text-gray-500" />
        </a>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onToggleFavorite(bookmark.id)}
            className={`rounded p-1 transition-colors ${
              bookmark.isFavorite
                ? "text-yellow-400"
                : "text-gray-500 hover:text-yellow-400"
            }`}
          >
            <Star size={13} fill={bookmark.isFavorite ? "currentColor" : "none"} />
          </button>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(bookmark.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(bookmark.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-900/50 hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mb-1.5 line-clamp-2 text-xs leading-relaxed text-gray-400">
        {bookmark.description}
      </p>

      {/* URL */}
      <p className="mb-2 truncate text-xs text-gray-500">{displayUrl}</p>

      {/* Collection badge + tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors.badge}`}
        >
          {COLLECTION_LABELS[bookmark.collection]}
        </span>
        {visibleTags.map((tag) => (
          <span key={tag} className="text-xs text-gray-500">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
