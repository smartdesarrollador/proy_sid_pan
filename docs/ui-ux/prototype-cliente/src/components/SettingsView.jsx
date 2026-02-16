import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Settings as SettingsIcon, Bell, Shield, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useDarkMode } from '../hooks/useDarkMode';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './shared/ThemeToggle';
import { userSettings as mockUserSettings } from '../data/mockData';

export const SettingsView = () => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();

  // State local para formulario
  const [settings, setSettings] = useState(mockUserSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleInputChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    // En producción: API call a PUT /api/users/{id}/settings
    console.log('Saving settings:', settings);
    alert(t('messages.saveSuccess'));
    setIsDirty(false);
  };

  const handlePasswordChange = () => {
    // En producción: API call a POST /api/users/{id}/change-password
    alert(t('messages.passwordChanged'));
    setShowPasswordFields(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">

        {/* Mi Perfil Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('profile.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('profile.description')}
              </p>
            </div>
          </div>

          {/* Avatar + Form */}
          <div className="space-y-4">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600 dark:text-primary-300" />
              </div>
              <button className="btn btn-secondary text-sm">
                {t('profile.uploadAvatar')}
              </button>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.firstName')}
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.profile.firstName}
                  onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.lastName')}
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.profile.lastName}
                  onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.email')}
              </label>
              <input
                type="email"
                className="input"
                value={settings.profile.email}
                onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Preferencias Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('preferences.description')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('preferences.language')}
              </label>
              <LanguageSwitcher />
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('preferences.theme')}
              </label>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isDarkMode ? t('preferences.darkMode') : t('preferences.lightMode')}
                </span>
              </div>
            </div>

            {/* Date format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('preferences.dateFormat')}
              </label>
              <select
                className="input"
                value={settings.preferences.dateFormat}
                onChange={(e) => handleInputChange('preferences', 'dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (15/02/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (02/15/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-02-15)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('preferences.timezone')}
              </label>
              <select
                className="input"
                value={settings.preferences.timezone}
                onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
              >
                <option value="America/Mexico_City">México (GMT-6)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notificaciones Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('notifications.description')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.keys(settings.notifications).map((key) => (
              <label key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t(`notifications.${key}`)}
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={settings.notifications[key]}
                  onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Seguridad Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('security.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('security.description')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Change Password */}
            <div>
              <button
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="btn btn-secondary text-sm"
              >
                {t('security.changePassword')}
              </button>

              {showPasswordFields && (
                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    className="input"
                    placeholder={t('security.currentPassword')}
                  />
                  <input
                    type="password"
                    className="input"
                    placeholder={t('security.newPassword')}
                  />
                  <input
                    type="password"
                    className="input"
                    placeholder={t('security.confirmPassword')}
                  />
                  <div className="flex gap-2">
                    <button onClick={handlePasswordChange} className="btn btn-primary text-sm">
                      {tCommon('save')}
                    </button>
                    <button onClick={() => setShowPasswordFields(false)} className="btn btn-secondary text-sm">
                      {tCommon('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('security.twoFactor')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {settings.security.twoFactorEnabled ? t('security.disable2FA') : t('security.enable2FA')}
                </p>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                checked={settings.security.twoFactorEnabled}
                onChange={(e) => handleInputChange('security', 'twoFactorEnabled', e.target.checked)}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Save Button (sticky footer) */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-10">
          <button onClick={handleSave} className="btn btn-primary flex items-center gap-2 shadow-lg">
            <Save className="w-4 h-4" />
            {t('profile.saveChanges')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
