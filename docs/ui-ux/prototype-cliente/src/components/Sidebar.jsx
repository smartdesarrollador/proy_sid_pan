import { Home, CheckSquare, Calendar, Folder, Share2, User, Settings, FileText, Users, Bookmark, Terminal, Key, Shield, Code2, ClipboardList, Activity, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

function Sidebar({ isOpen, activeView, onNavigate }) {
  const { t } = useTranslation('sidebar');
  const { t: tCommon } = useTranslation('common');

  const menuGroups = [
    {
      id: 'general',
      label: null,
      items: [
        { id: 'user-dashboard', label: t('menu.dashboard'), icon: Home },
      ]
    },
    {
      id: 'productivity',
      label: t('groups.productivity'),
      items: [
        { id: 'tasks', label: t('menu.tasks'), icon: CheckSquare },
        { id: 'calendar', label: t('menu.calendar'), icon: Calendar },
        { id: 'notes', label: t('menu.notes'), icon: FileText },
        { id: 'contacts', label: t('menu.contacts'), icon: Users },
        { id: 'bookmarks', label: t('menu.bookmarks'), icon: Bookmark },
      ]
    },
    {
      id: 'devops',
      label: t('groups.devops'),
      items: [
        { id: 'projects', label: t('menu.projects'), icon: Folder },
        { id: 'env-vars', label: t('menu.envVars'), icon: Terminal },
        { id: 'ssh-keys', label: t('menu.sshKeys'), icon: Key },
        { id: 'ssl-certs', label: t('menu.sslCerts'), icon: Shield },
        { id: 'snippets', label: t('menu.snippets'), icon: Code2 },
      ]
    },
    {
      id: 'admin',
      label: t('groups.admin'),
      items: [
        { id: 'forms', label: t('menu.forms'), icon: ClipboardList },
        { id: 'shared-with-me', label: t('menu.shared'), icon: Share2 },
        { id: 'audit-log', label: t('menu.auditLog'), icon: Activity },
        { id: 'reports', label: t('menu.reports'), icon: BarChart2 },
      ]
    },
    {
      id: 'account',
      label: null,
      items: [
        { id: 'profile', label: t('menu.profile'), icon: User },
        { id: 'settings', label: tCommon('common.settings'), icon: Settings },
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 overflow-y-auto">
      <nav className="p-4">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.id} className={groupIdx > 0 ? 'mt-4' : ''}>
            {group.label && (
              <p className="px-4 mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id ||
                  (item.id === 'projects' && activeView === 'project-detail');

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                );
              })}
            </div>
            {groupIdx < menuGroups.length - 1 && group.label !== null && menuGroups[groupIdx + 1]?.label !== null && (
              <div className="border-t border-gray-100 dark:border-gray-700 mt-3" />
            )}
          </div>
        ))}
      </nav>

      {/* Help section */}
      <div className="p-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">{t('help.title')}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {t('help.description')}
          </p>
          <button className="w-full bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            {t('help.button')}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
