import { useState, useMemo } from "react";
import { Search, Plus, FolderKanban } from "lucide-react";
import { MOCK_PROJECTS, STATUS_LABELS } from "../../data/mockProjects";
import type { ProjectStatus } from "../../data/mockProjects";
import ProjectCard from "../projects/ProjectCard";

type FilterValue = ProjectStatus | "all";

const FILTER_PILLS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "paused", label: "Pausados" },
  { value: "archived", label: "Archivados" },
];

export default function ProjectsPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter((project) => {
      if (search && !project.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      return true;
    });
  }, [search, statusFilter]);

  const activeCount = MOCK_PROJECTS.filter((p) => p.status === "active").length;

  const handleEdit = (id: string) => {
    console.log("Edit project:", id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete project:", id);
  };

  const handleNewProject = () => {
    console.log("New project");
  };

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">Proyectos</h2>
        <span className="text-xs text-gray-400">{activeCount} activos</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Buscar proyectos..."
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
            onClick={() => setStatusFilter(pill.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === pill.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* New project button */}
      <button
        onClick={handleNewProject}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={14} />
        Nuevo Proyecto
      </button>

      {/* Project list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FolderKanban size={32} className="mb-2" />
            <p className="text-sm">No se encontraron proyectos</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 border-t border-gray-700 pt-2 text-center text-xs text-gray-500">
        Mostrando {filteredProjects.length} de {MOCK_PROJECTS.length}
      </div>
    </div>
  );
}
