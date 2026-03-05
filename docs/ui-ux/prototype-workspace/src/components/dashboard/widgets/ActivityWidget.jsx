import { CheckCircle, Calendar, Users, FileText } from 'lucide-react';

export const ActivityWidget = () => {
  // Mock activity data
  const activities = [
    {
      id: 1,
      type: 'task_completed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      title: 'Completaste la tarea',
      description: '"Configurar CI/CD pipeline"',
      timestamp: 'Hace 2 horas'
    },
    {
      id: 2,
      type: 'event_created',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      title: 'Creaste un evento',
      description: '"Code Review Session"',
      timestamp: 'Hace 3 horas'
    },
    {
      id: 3,
      type: 'task_assigned',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      title: 'Te asignaron una tarea',
      description: '"Optimizar queries de base de datos"',
      timestamp: 'Hace 5 horas'
    },
    {
      id: 4,
      type: 'comment_added',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      title: 'Comentaste en',
      description: '"Revisar PR #234"',
      timestamp: 'Ayer'
    },
    {
      id: 5,
      type: 'task_completed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      title: 'Completaste la tarea',
      description: '"Implementar autenticación JWT"',
      timestamp: 'Hace 2 días'
    }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Ver todo
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
              <activity.icon className={`w-5 h-5 ${activity.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">
                {activity.title}{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">{activity.description}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.timestamp}</p>
            </div>

            {index < activities.length - 1 && (
              <div className="absolute left-[26px] mt-10 h-8 w-0.5 bg-gray-200 dark:bg-gray-700" style={{ position: 'relative', left: '26px', marginTop: '8px', height: '24px' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
