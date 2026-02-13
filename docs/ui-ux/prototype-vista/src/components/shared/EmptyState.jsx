import { LucideIcon } from 'lucide-react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action = null,
}) => {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" />}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
