import { useState } from 'react';
import { User, Building2, Palette, Shield, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../hooks/usePermissions';
import clsx from 'clsx';

import ProfileSettings from './settings/ProfileSettings';
import OrganizationSettings from './settings/OrganizationSettings';
import InterfaceSettings from './settings/InterfaceSettings';
import SecuritySettings from './settings/SecuritySettings';
import NotificationsSettings from './settings/NotificationsSettings';

function Settings() {
  const { t } = useTranslation('settings');
  const { canUpdateSettings, isOrgAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: User },
    { id: 'organization', label: t('tabs.organization'), icon: Building2, adminOnly: true },
    { id: 'interface', label: t('tabs.interface'), icon: Palette },
    { id: 'security', label: t('tabs.security'), icon: Shield },
    { id: 'notifications', label: t('tabs.notifications'), icon: Bell }
  ];

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isOrgAdmin());

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'organization':
        return <OrganizationSettings />;
      case 'interface':
        return <InterfaceSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationsSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {t('subtitle')}
          {!canUpdateSettings() && (
            <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
              (Solo lectura)
            </span>
          )}
        </p>
      </div>

      {/* 2-column layout: sidebar tabs + content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs (vertical navigation) */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="card p-2 space-y-1">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Settings;
