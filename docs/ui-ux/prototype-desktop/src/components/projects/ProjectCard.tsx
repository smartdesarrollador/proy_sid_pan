import { Pencil, Trash2, FolderKanban, Calendar, LayoutGrid, ListTodo, Users } from "lucide-react";
import type { Project } from "../../data/mockProjects";
import { STATUS_LABELS, STATUS_COLORS, PROJECT_COLORS } from "../../data/mockProjects";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${months[date.getMonth()]}`;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <div className="group overflow-hidden rounded-lg border border-gray-700 bg-[#1a1a2e] transition-colors hover:border-gray-600">
      {/* Color bar */}
      <div className={`h-[1.5px] ${PROJECT_COLORS[project.color]}`} />

      <div className="p-3">
        {/* Title + hover actions */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderKanban size={14} className="shrink-0 text-gray-400" />
            <h3 className="text-sm font-medium leading-snug text-gray-200">
              {project.name}
            </h3>
          </div>
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(project.id)}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-900/50 hover:text-red-300"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Description */}
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-400">
          {project.description}
        </p>

        {/* Stats */}
        <div className="mb-2 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1" title="Secciones">
            <LayoutGrid size={11} />
            <span>{project.sections}</span>
          </div>
          <div className="flex items-center gap-1" title="Items">
            <ListTodo size={11} />
            <span>{project.items}</span>
          </div>
          <div className="flex items-center gap-1" title="Miembros">
            <Users size={11} />
            <span>{project.members}</span>
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={11} />
          <span>{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
        </div>
      </div>
    </div>
  );
}
