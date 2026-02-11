import { CheckSquare, Calendar } from 'lucide-react';
import { tasks } from '../../../data/mockData';
import { PriorityBadge } from '../../shared/PriorityBadge';
import { StatusBadge } from '../../shared/StatusBadge';
import { EmptyState } from '../../shared/EmptyState';

export const TasksWidget = ({ onNavigate }) => {
  // Mock current user - en producción vendría del contexto de auth
  const currentUserId = 'user-003';

  // Filtrar tareas asignadas al usuario actual (solo activas)
  const myTasks = tasks
    .filter(t => t.assignee === currentUserId && t.status !== 'done')
    .sort((a, b) => {
      // Ordenar por prioridad (alta > media > baja) y luego por fecha
      const priorityOrder = { alta: 3, media: 2, baja: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Si misma prioridad, ordenar por fecha límite
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    })
    .slice(0, 5); // Solo primeras 5

  const handleTaskClick = (task) => {
    if (onNavigate) {
      onNavigate('tasks', task);
    } else {
      alert('Navegar a TaskBoard con tarea seleccionada');
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mis Tareas</h3>
        <button
          onClick={() => onNavigate ? onNavigate('tasks') : alert('Navegar a TaskBoard')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todas
        </button>
      </div>

      {myTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Sin tareas asignadas"
          description="No tienes tareas pendientes en este momento."
        />
      ) : (
        <div className="space-y-3">
          {myTasks.map(task => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm flex-1">
                  {task.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  Vence: {task.dueDate}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
