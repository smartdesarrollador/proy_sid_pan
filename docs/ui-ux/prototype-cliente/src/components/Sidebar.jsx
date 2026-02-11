import { Home, CheckSquare, Calendar, Folder, User, Settings } from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { id: 'user-dashboard', label: 'Dashboard', icon: Home },
  { id: 'tasks', label: 'Tareas', icon: CheckSquare },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'projects', label: 'Proyectos', icon: Folder },
  { id: 'profile', label: 'Mi Perfil', icon: User },
  { id: 'settings', label: 'Configuración', icon: Settings }
];

function Sidebar({ isOpen, activeView, onNavigate }) {
  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-20 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Help section */}
      <div className="p-4 mt-8 border-t border-gray-200">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">¿Necesitas ayuda?</h3>
          <p className="text-xs text-gray-600 mb-3">
            Consulta nuestra documentación o contacta con soporte
          </p>
          <button className="w-full bg-white text-primary-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            Ver ayuda
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
