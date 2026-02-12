import { Home, CheckSquare, Calendar, Folder, Share2, User, Settings } from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { id: 'user-dashboard', label: 'Dashboard', icon: Home },
  { id: 'tasks', label: 'Tareas', icon: CheckSquare },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'projects', label: 'Proyectos', icon: Folder },
  { id: 'shared-with-me', label: 'Compartidos conmigo', icon: Share2 },
  { id: 'profile', label: 'Mi Perfil', icon: User },
  { id: 'settings', label: 'Configuración', icon: Settings }
];

function Sidebar({ isOpen, activeView, onNavigate }) {
  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 overflow-y-auto">
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
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Help section */}
      <div className="p-4 mt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">¿Necesitas ayuda?</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Consulta nuestra documentación o contacta con soporte
          </p>
          <button className="w-full bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Ver ayuda
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
