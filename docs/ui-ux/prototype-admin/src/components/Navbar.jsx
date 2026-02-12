import { Menu, Bell, Settings, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useState } from 'react';
import { currentTenant } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import ThemeToggle from './shared/ThemeToggle';

function Navbar({ onMenuClick }) {
  const { currentUser, logout } = useAuth();
  const { getPrimaryRole, getRoleColor } = usePermissions();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const primaryRole = getPrimaryRole();
  const roleColor = getRoleColor();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-30 top-0">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {currentTenant.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentTenant.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentTenant.subdomain}.platform.com</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: `${roleColor}20`,
              color: roleColor
            }}
          >
            <Shield className="w-4 h-4" />
            {primaryRole}
          </div>

          {/* Plan badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium">
            <span className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full"></span>
            Plan Professional
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-300" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.roles?.join(', ')}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{currentUser?.email}</p>
                  <div className="flex flex-wrap gap-1">
                    {currentUser?.roles?.map(role => (
                      <span
                        key={role}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getRoleColor()}20`,
                          color: getRoleColor()
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
