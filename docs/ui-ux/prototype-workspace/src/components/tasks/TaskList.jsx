import { TaskCard } from './TaskCard';
import { EmptyState } from '../shared/EmptyState';
import { CheckSquare } from 'lucide-react';

export const TaskList = ({ tasks, onTaskClick, onDelete, onStatusChange }) => {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No hay tareas"
        description="Crea tu primera tarea para comenzar a organizar tu trabajo."
      />
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onTaskClick}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};
