import { TasksWidget } from './widgets/TasksWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { MetricsWidget } from './widgets/MetricsWidget';
import { ActivityWidget } from './widgets/ActivityWidget';

export const UserDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mi Dashboard</h1>
        <p className="text-gray-600">Bienvenido, aquí está tu resumen personalizado</p>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Métricas */}
        <div className="lg:col-span-3">
          <MetricsWidget />
        </div>

        {/* Tareas */}
        <div className="lg:col-span-2">
          <TasksWidget />
        </div>

        {/* Calendario */}
        <div>
          <CalendarWidget />
        </div>

        {/* Actividad reciente */}
        <div className="lg:col-span-3">
          <ActivityWidget />
        </div>
      </div>

      {/* Personalización (próximamente) */}
      <div className="mt-6 text-center">
        <button
          onClick={() => alert('Próximamente: Personaliza tu dashboard con drag & drop')}
          className="btn btn-ghost text-sm"
        >
          ✨ Personalizar Dashboard
        </button>
      </div>
    </div>
  );
};
