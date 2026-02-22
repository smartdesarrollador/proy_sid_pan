import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  CreditCard,
  FileText,
  Settings,
  Building2,
  BarChart3,
  Tag,
  FileBarChart,
  Bell,
  Receipt,
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../hooks/usePermissions';

function Sidebar({ isOpen, activeView, onNavigate }) {
  const { t } = useTranslation('sidebar');
  const { hasPermission, canUpgradePlan } = usePermissions();

  const menuItems = [
    { id: 'dashboard', label: t('menu.dashboard'), icon: LayoutDashboard, permission: 'dashboard.read' },
    { id: 'users', label: t('menu.users'), icon: Users, permission: 'users.read' },
    { id: 'clients', label: t('menu.clients'), icon: Building2, permission: 'customers.read' },
    { id: 'analytics', label: t('menu.analytics'), icon: BarChart3, permission: 'analytics.read' },
    { id: 'reports', label: t('menu.reports'), icon: FileBarChart, permission: 'analytics.read' },
    { id: 'notifications', label: t('menu.notifications'), icon: Bell, permission: 'dashboard.read' },
    { id: 'billing', label: t('menu.billing'), icon: Receipt, permission: 'billing.read' },
    { id: 'roles', label: t('menu.roles'), icon: Shield, permission: 'roles.read' },
    { id: 'permissions', label: t('menu.permissions'), icon: Key, permission: 'roles.read' },
    { id: 'subscription', label: t('menu.subscription'), icon: CreditCard, permission: 'billing.read' },
    { id: 'promotions', label: t('menu.promotions'), icon: Tag, permission: 'promotions.read' },
    { id: 'audit', label: t('menu.audit'), icon: FileText, permission: 'audit.read' },
    { id: 'settings', label: t('menu.settings'), icon: Settings, permission: 'settings.read' },
  ];

  if (!isOpen) return null;

  // Filtrar items según permisos del usuario
  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {visibleMenuItems.map((item) => {
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

      {/* CTA de upgrade - solo visible si tiene permisos de billing */}
      {canUpgradePlan() && (
        <div className="p-4 mt-8">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-xl p-4 text-white">
            <h3 className="font-semibold text-sm mb-2">¿Necesitas más usuarios?</h3>
            <p className="text-xs text-primary-100 dark:text-primary-200 mb-3">
              Actualiza a Enterprise para usuarios ilimitados
            </p>
            <button className="w-full bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors">
              Ver planes
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
