export const PriorityBadge = ({ priority }) => {
  const priorityStyles = {
    alta: 'priority-alta',
    media: 'priority-media',
    baja: 'priority-baja'
  };

  const priorityLabels = {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja'
  };

  return (
    <span className={`badge ${priorityStyles[priority] || priorityStyles.baja}`}>
      {priorityLabels[priority] || 'Baja'}
    </span>
  );
};
