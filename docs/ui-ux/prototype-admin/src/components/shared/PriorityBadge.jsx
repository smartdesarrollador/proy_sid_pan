export const PriorityBadge = ({ priority }) => {
  const priorityStyles = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-orange-100 text-orange-700',
    baja: 'bg-gray-100 text-gray-700'
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
