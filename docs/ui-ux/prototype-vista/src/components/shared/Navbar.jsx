import { Moon, Sun, Home, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPlanDisplayName } from '../../data/featureGates';

export const Navbar = ({ activeService, onNavigate, onToggleSidebar }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { currentUser, currentPlan, logout } = useAuth();

  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get plan badge color
  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: 'badge-gray',
      starter: 'badge-warning',
      professional: 'badge-success',
      enterprise: 'badge-primary',
    };
    return colors[plan] || 'badge-gray';
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Home className="w-6 h-6" />
              <span className="text-lg font-bold hidden sm:inline">
                Vista Digital
              </span>
            </button>
            {activeService !== 'dashboard' && (
              <span className="text-gray-400 dark:text-gray-500 hidden md:inline">
                / {activeService.charAt(0).toUpperCase() + activeService.slice(1)}
              </span>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User Info - Hidden on small screens */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser.email}
              </p>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
              {getInitials(currentUser.name)}
            </div>

            {/* Plan Badge */}
            <span className={`badge ${getPlanBadgeColor(currentPlan)} hidden sm:inline-flex`}>
              {getPlanDisplayName(currentPlan)}
            </span>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
