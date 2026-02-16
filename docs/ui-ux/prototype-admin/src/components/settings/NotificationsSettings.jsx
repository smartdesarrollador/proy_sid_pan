import { useState } from 'react';
import { Mail, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../hooks/usePermissions';
import { notificationSettings as mockNotificationSettings } from '../../data/mockData';
import clsx from 'clsx';

function NotificationsSettings() {
  const { t } = useTranslation('settings');
  const { canUpdateSettings } = usePermissions();

  const [settings, setSettings] = useState(mockNotificationSettings);
  const [isDirty, setIsDirty] = useState(false);

  const handleEmailToggle = (category) => {
    if (category === 'security') return; // Security always enabled
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        [category]: !settings.email[category]
      }
    });
    setIsDirty(true);
  };

  const handlePushToggle = () => {
    if (!settings.push.enabled && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setSettings({
            ...settings,
            push: { enabled: true, browserPermission: 'granted' }
          });
          setIsDirty(true);
        }
      });
    } else {
      setSettings({
        ...settings,
        push: { ...settings.push, enabled: !settings.push.enabled }
      });
      setIsDirty(true);
    }
  };

  const handleFrequencyChange = (frequency) => {
    setSettings({ ...settings, frequency });
    setIsDirty(true);
  };

  const handleSave = () => {
    alert('Preferencias de notificaciones guardadas');
    setIsDirty(false);
  };

  const emailCategories = [
    {
      key: 'security',
      title: t('notifications.security_alerts'),
      description: t('notifications.security_desc'),
      locked: true
    },
    {
      key: 'account',
      title: t('notifications.account_updates'),
      description: t('notifications.account_desc')
    },
    {
      key: 'team',
      title: t('notifications.team_activity'),
      description: t('notifications.team_desc')
    },
    {
      key: 'marketing',
      title: t('notifications.marketing'),
      description: t('notifications.marketing_desc')
    }
  ];

  const frequencies = [
    { value: 'instant', label: t('notifications.frequency_instant') },
    { value: 'daily', label: t('notifications.frequency_daily') },
    { value: 'weekly', label: t('notifications.frequency_weekly') }
  ];

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('notifications.email_title')}
        </h2>
      </div>

      {/* Email notifications */}
      <div className="space-y-4">
        {emailCategories.map(category => (
          <div
            key={category.key}
            className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {category.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleEmailToggle(category.key)}
              disabled={!canUpdateSettings() || category.locked}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                category.locked && 'opacity-50 cursor-not-allowed',
                !category.locked && !canUpdateSettings() && 'opacity-50 cursor-not-allowed',
                settings.email[category.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.email[category.key] ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Push notifications */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('notifications.push_title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('notifications.push_description')}
              </p>
            </div>
          </div>
          <button
            onClick={handlePushToggle}
            disabled={!canUpdateSettings()}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              settings.push.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                settings.push.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Notification frequency */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          {t('notifications.frequency_title')}
        </h3>
        <div className="space-y-2">
          {frequencies.map(freq => (
            <label
              key={freq.value}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="frequency"
                value={freq.value}
                checked={settings.frequency === freq.value}
                onChange={() => handleFrequencyChange(freq.value)}
                disabled={!canUpdateSettings()}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {freq.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      {canUpdateSettings() && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="btn btn-secondary" onClick={() => setIsDirty(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!isDirty}>
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsSettings;
