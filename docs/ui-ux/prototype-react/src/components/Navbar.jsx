import { Menu, Bell, Settings, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useState } from 'react';
import { currentTenant } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

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
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {currentTenant.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {currentTenant.name}
              </h1>
              <p className="text-xs text-gray-500">{currentTenant.subdomain}.platform.com</p>
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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            Plan Professional
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-gray-500">{currentUser?.roles?.join(', ')}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{currentUser?.email}</p>
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

                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
