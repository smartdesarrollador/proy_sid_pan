import { Pencil, Trash2, Pin } from "lucide-react";
import type { Note } from "../../data/mockNotes";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../data/mockNotes";

interface NoteCardProps {
  note: Note;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const colors = CATEGORY_COLORS[note.category];
  const visibleTags = note.tags.slice(0, 3);

  return (
    <div
      className={`group rounded-lg border border-gray-700 border-l-4 ${colors.border} bg-[#1a1a2e] p-3 transition-colors hover:border-gray-600`}
    >
      {/* Title + pin + hover actions */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-200">
          {note.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {note.isPinned && (
            <Pin size={12} className="rotate-45 text-yellow-400" />
          )}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(note.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-900/50 hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Content preview */}
      <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-400">
        {note.content}
      </p>

      {/* Category badge + tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors.badge}`}
        >
          {CATEGORY_LABELS[note.category]}
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
