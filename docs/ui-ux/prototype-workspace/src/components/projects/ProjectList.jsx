import { ProjectCard } from './ProjectCard';
import { EmptyState } from '../shared/EmptyState';

export const ProjectList = ({ projects, viewMode, onSelect, onEdit, onDelete }) => {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No tienes proyectos"
        message="Crea tu primer proyecto para organizar credenciales, documentos y configuraciones"
        action="Crear Proyecto"
        onAction={() => {}}
      />
    );
  }

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'space-y-4';

  return (
    <div className={gridClass}>
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          viewMode={viewMode}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
