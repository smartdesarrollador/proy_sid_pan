export const StatusBadge = ({ status }) => {
  const statusStyles = {
    todo: 'badge-todo',
    in_progress: 'badge-in-progress',
    in_review: 'badge-in-review',
    done: 'badge-done'
  };

  const statusLabels = {
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    in_review: 'En Revisión',
    done: 'Completado'
  };

  return (
    <span className={`badge ${statusStyles[status] || statusStyles.todo}`}>
      {statusLabels[status] || 'Por Hacer'}
    </span>
  );
};
