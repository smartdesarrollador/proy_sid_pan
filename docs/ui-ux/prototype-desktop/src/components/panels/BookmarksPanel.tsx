import { useState, useMemo } from "react";
import { Search, Plus, Bookmark } from "lucide-react";
import { MOCK_BOOKMARKS, COLLECTION_LABELS } from "../../data/mockBookmarks";
import type { BookmarkCollection } from "../../data/mockBookmarks";
import BookmarkCard from "../bookmarks/BookmarkCard";

const COLLECTION_FILTERS: Array<{ value: BookmarkCollection | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "dev-resources", label: "Dev Resources" },
  { value: "tools", label: "Tools" },
  { value: "databases", label: "Databases" },
  { value: "design", label: "Design" },
];

export default function BookmarksPanel() {
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<BookmarkCollection | "all">("all");

  const filteredBookmarks = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_BOOKMARKS.filter((bm) => {
      if (
        q &&
        !bm.title.toLowerCase().includes(q) &&
        !bm.url.toLowerCase().includes(q) &&
        !bm.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (collectionFilter !== "all" && bm.collection !== collectionFilter) return false;
      return true;
    });
  }, [search, collectionFilter]);

  const handleEdit = (id: string) => {
    console.log("Edit bookmark:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete bookmark:", id);
  };

  const handleToggleFavorite = (id: string) => {
    console.log("Toggle favorite:", id);
  };

  const handleNewBookmark = () => {
    console.log("New bookmark");
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Bookmarks</h2>
        <span className="text-xs text-gray-400">{MOCK_BOOKMARKS.length} bookmarks</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar bookmarks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-[#1a1a2e] py-1.5 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Collection filter pills */}
      <div className="mb-2 flex gap-1 overflow-x-auto">
        {COLLECTION_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setCollectionFilter(filter.value)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              collectionFilter === filter.value
                ? "bg-blue-600 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* New bookmark button */}
      <button
        onClick={handleNewBookmark}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={14} />
        Nuevo Bookmark
      </button>

      {/* Bookmarks list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map((bm) => (
            <BookmarkCard
              key={bm.id}
              bookmark={bm}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Bookmark size={32} className="mb-2" />
            <p className="text-sm">No se encontraron bookmarks</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredBookmarks.length} de {MOCK_BOOKMARKS.length}
      </div>
    </div>
  );
}
