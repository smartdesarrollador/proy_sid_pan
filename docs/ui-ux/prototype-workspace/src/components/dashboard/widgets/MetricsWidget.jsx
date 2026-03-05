import { CheckCircle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { tasks, events, userStats } from '../../../data/mockData';

export const MetricsWidget = () => {
  // Mock current user
  const currentUserId = 'user-003';
  const stats = userStats[currentUserId] || {
    tasksCompleted: 0,
    tasksInProgress: 0,
    upcomingEvents: 0,
    overdueTasksCount: 0
  };

  // Calcular tareas en progreso del usuario actual
  const myTasksInProgress = tasks.filter(
    t => t.assignee === currentUserId && t.status === 'in_progress'
  ).length;

  // Calcular eventos próximos (próximos 7 días)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingEventsCount = events.filter(e => {
    const eventDate = new Date(e.startDate);
    return eventDate >= today && eventDate <= nextWeek;
  }).length;

  const metrics = [
    {
      label: 'Tareas Completadas',
      value: stats.tasksCompleted,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      trend: '+12% vs mes anterior'
    },
    {
      label: 'Tareas en Progreso',
      value: myTasksInProgress,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      trend: null
    },
    {
      label: 'Eventos Próximos',
      value: upcomingEventsCount,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      trend: 'Próximos 7 días'
    },
    {
      label: 'Productividad',
      value: '94%',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      trend: '+5% esta semana'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
          </div>

          <div className="mb-1">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {metric.label}
            </div>
          </div>

          {metric.trend && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {metric.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
