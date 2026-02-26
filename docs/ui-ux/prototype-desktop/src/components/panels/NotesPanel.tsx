import { useState, useMemo } from "react";
import { Search, Plus, Pin, StickyNote } from "lucide-react";
import { MOCK_NOTES, CATEGORY_LABELS } from "../../data/mockNotes";
import type { NoteCategory } from "../../data/mockNotes";
import NoteCard from "../notes/NoteCard";

const CATEGORY_FILTERS: Array<{ value: NoteCategory | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "work", label: "Trabajo" },
  { value: "personal", label: "Personal" },
  { value: "ideas", label: "Ideas" },
  { value: "archive", label: "Archivo" },
];

export default function NotesPanel() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | "all">("all");

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_NOTES.filter((note) => {
      if (q && !note.title.toLowerCase().includes(q) && !note.content.toLowerCase().includes(q)) {
        return false;
      }
      if (categoryFilter !== "all" && note.category !== categoryFilter) return false;
      return true;
    });
  }, [search, categoryFilter]);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  const handleEdit = (id: string) => {
    console.log("Edit note:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete note:", id);
  };

  const handleNewNote = () => {
    console.log("New note");
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Notas</h2>
        <span className="text-xs text-gray-400">{MOCK_NOTES.length} notas</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-[#1a1a2e] py-1.5 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Category filter pills */}
      <div className="mb-2 flex gap-1 overflow-x-auto">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setCategoryFilter(filter.value)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              categoryFilter === filter.value
                ? "bg-blue-600 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* New note button */}
      <button
        onClick={handleNewNote}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={14} />
        Nueva Nota
      </button>

      {/* Notes list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredNotes.length > 0 ? (
          <>
            {/* Pinned section */}
            {pinnedNotes.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 py-1">
                  <Pin size={11} className="rotate-45 text-gray-500" />
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fijadas
                  </span>
                </div>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}

            {/* Other notes section */}
            {otherNotes.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Otras notas
                  </span>
                </div>
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <StickyNote size={32} className="mb-2" />
            <p className="text-sm">No se encontraron notas</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredNotes.length} de {MOCK_NOTES.length}
      </div>
    </div>
  );
}
