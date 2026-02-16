import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../shared/ThemeToggle';
import { interfaceSettings as mockInterfaceSettings } from '../../data/mockData';

function InterfaceSettings() {
  const { t } = useTranslation('settings');
  const { isDark } = useDarkMode();
  const { currentLanguage } = useLanguage();

  const [settings, setSettings] = useState(mockInterfaceSettings);

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: '15/02/2026' },
    { value: 'MM/DD/YYYY', label: '02/15/2026' },
    { value: 'YYYY-MM-DD', label: '2026-02-15' }
  ];

  const timezones = [
    { value: 'America/Mexico_City', label: 'México (GMT-6)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
  ];

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('interface.title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('interface.description')}
        </p>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('interface.language')}
        </label>
        <LanguageSwitcher />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {currentLanguage === 'es' ? 'Idioma actual: Español' : 'Current language: English'}
        </p>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('interface.theme')}
        </label>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isDark ? t('interface.dark_mode') : t('interface.light_mode')}
          </span>
        </div>
      </div>

      {/* Date format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('interface.date_format')}
        </label>
        <select
          className="input"
          value={settings.dateFormat}
          onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
        >
          {dateFormats.map(format => (
            <option key={format.value} value={format.value}>
              {format.value} ({format.label})
            </option>
          ))}
        </select>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('interface.timezone')}
        </label>
        <select
          className="input"
          value={settings.timezone}
          onChange={(e) => setSettings({...settings, timezone: e.target.value})}
        >
          {timezones.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Los cambios de idioma y tema se aplican instantáneamente. Las preferencias de formato y zona horaria se guardarán al hacer clic en "Guardar cambios".
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="btn btn-secondary">
          Cancelar
        </button>
        <button className="btn btn-primary">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

export default InterfaceSettings;
