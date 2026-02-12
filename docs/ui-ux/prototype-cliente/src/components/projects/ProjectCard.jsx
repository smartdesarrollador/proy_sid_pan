import { Edit2, Trash2, Folder, Users, FileText, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export const ProjectCard = ({ project, viewMode, onSelect, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  };

  const statusLabels = {
    active: 'Activo',
    archived: 'Archivado',
    planning: 'Planificación'
  };

  if (viewMode === 'list') {
    return (
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          {/* Color Indicator */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${project.color}15`, color: project.color }}
          >
            <Folder className="w-6 h-6" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 truncate"
                onClick={() => onSelect(project.id)}
              >
                {project.name}
              </h3>
              <span className={`badge ${statusColors[project.status]}`}>
                {statusLabels[project.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{project.description}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4" />
              <span>{project.sectionsCount} secciones</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{project.itemsCount} items</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{project.membersCount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(project)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="card p-6 hover:shadow-lg transition-shadow relative group">
      {/* Color Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
        style={{ backgroundColor: project.color }}
      />

      {/* Actions Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {showActions && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
            <button
              onClick={() => {
                onEdit(project);
                setShowActions(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => {
                onDelete(project.id);
                setShowActions(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${project.color}15`, color: project.color }}
      >
        <Folder className="w-6 h-6" />
      </div>

      {/* Title & Status */}
      <div className="mb-2">
        <h3
          className="font-semibold text-lg text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400"
          onClick={() => onSelect(project.id)}
        >
          {project.name}
        </h3>
        <span className={`badge ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
        {project.description || 'Sin descripción'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{project.sectionsCount}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Secciones</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{project.itemsCount}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Items</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{project.membersCount}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Miembros</div>
        </div>
      </div>

      {/* Dates */}
      {project.startDate && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Inicio: {project.startDate}</span>
            {project.endDate && <span>Fin: {project.endDate}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
