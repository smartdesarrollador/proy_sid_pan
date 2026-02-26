import { useState, useMemo } from "react";
import { Search, Share2 } from "lucide-react";
import { MOCK_SHARED, RESOURCE_TYPE_LABELS } from "../../data/mockShared";
import type { ResourceType } from "../../data/mockShared";
import SharedCard from "../shared/SharedCard";

type FilterValue = ResourceType | "all";

const FILTER_PILLS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "project", label: "Proyectos" },
  { value: "task", label: "Tareas" },
  { value: "event", label: "Eventos" },
  { value: "document", label: "Documentos" },
  { value: "note", label: "Notas" },
];

export default function SharedPanel() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");

  const filteredItems = useMemo(() => {
    return MOCK_SHARED.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.resourceName.toLowerCase().includes(q) &&
          !item.sharedByName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (typeFilter !== "all" && item.resourceType !== typeFilter) return false;
      return true;
    });
  }, [search, typeFilter]);

  const handleOpen = (id: string) => {
    console.log("Open shared item:", id);
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Compartidos</h2>
        <span className="text-xs text-gray-400">{MOCK_SHARED.length} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar por nombre o persona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-[#1a1a2e] py-1.5 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Filter pills */}
      <div className="mb-3 flex flex-wrap gap-1">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setTypeFilter(pill.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              typeFilter === pill.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Shared items list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <SharedCard key={item.id} item={item} onOpen={handleOpen} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Share2 size={32} className="mb-2" />
            <p className="text-sm">No tienes elementos compartidos</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredItems.length} de {MOCK_SHARED.length}
      </div>
    </div>
  );
}
