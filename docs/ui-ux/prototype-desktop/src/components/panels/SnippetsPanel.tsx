import { useState, useMemo } from "react";
import { Search, Plus, Code2 } from "lucide-react";
import { MOCK_SNIPPETS, LANGUAGE_LABELS } from "../../data/mockSnippets";
import type { SnippetLanguage } from "../../data/mockSnippets";
import SnippetCard from "../snippets/SnippetCard";

type FilterValue = SnippetLanguage | "all";

const FILTER_PILLS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "css", label: "CSS" },
];

export default function SnippetsPanel() {
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<FilterValue>("all");

  const filteredSnippets = useMemo(() => {
    return MOCK_SNIPPETS.filter((snippet) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !snippet.title.toLowerCase().includes(q) &&
          !snippet.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (languageFilter !== "all" && snippet.language !== languageFilter) return false;
      return true;
    });
  }, [search, languageFilter]);

  const handleCopy = (id: string) => {
    const snippet = MOCK_SNIPPETS.find((s) => s.id === id);
    if (snippet) navigator.clipboard.writeText(snippet.code);
  };

  const handleEdit = (id: string) => {
    console.log("Edit snippet:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete snippet:", id);
  };

  const handleToggleFavorite = (id: string) => {
    console.log("Toggle favorite:", id);
  };

  const handleNewSnippet = () => {
    console.log("New snippet");
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Snippets</h2>
        <span className="text-xs text-gray-400">{MOCK_SNIPPETS.length} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar snippets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-[#1a1a2e] py-1.5 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Filter pills */}
      <div className="mb-2 flex flex-wrap gap-1">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setLanguageFilter(pill.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              languageFilter === pill.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* New snippet button */}
      <button
        onClick={handleNewSnippet}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={14} />
        Nuevo Snippet
      </button>

      {/* Snippet list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredSnippets.length > 0 ? (
          filteredSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onCopy={handleCopy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Code2 size={32} className="mb-2" />
            <p className="text-sm">No se encontraron snippets</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredSnippets.length} de {MOCK_SNIPPETS.length}
      </div>
    </div>
  );
}
