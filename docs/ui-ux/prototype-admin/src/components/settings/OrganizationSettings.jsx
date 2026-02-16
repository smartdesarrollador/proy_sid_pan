import { useState } from 'react';
import { Lock, Building2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../hooks/usePermissions';
import { EmptyState } from '../shared/EmptyState';
import { organizationSettings as mockOrgSettings } from '../../data/mockData';

function OrganizationSettings() {
  const { t } = useTranslation('settings');
  const { canUpdateSettings, isOrgAdmin } = usePermissions();

  const [orgData, setOrgData] = useState(mockOrgSettings);
  const [isDirty, setIsDirty] = useState(false);

  const colorPresets = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleSave = () => {
    alert('Configuración de organización actualizada');
    setIsDirty(false);
  };

  const handleCancel = () => {
    setOrgData(mockOrgSettings);
    setIsDirty(false);
  };

  // Permission gate
  if (!isOrgAdmin()) {
    return (
      <div className="card p-6">
        <EmptyState
          icon={Lock}
          title={t('organization.admin_only')}
          description={t('organization.admin_only_desc')}
        />
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('organization.title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('organization.description')}
        </p>
      </div>

      {/* Logo section */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Building2 className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <button className="btn btn-secondary text-sm flex items-center gap-2" disabled={!canUpdateSettings()}>
            <Upload className="w-4 h-4" />
            {t('organization.upload_logo')}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PNG, SVG max 1MB
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('organization.organization_name')}
        </label>
        <input
          type="text"
          className="input"
          value={orgData.name}
          onChange={(e) => {
            setOrgData({...orgData, name: e.target.value});
            setIsDirty(true);
          }}
          disabled={!canUpdateSettings()}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('organization.subdomain')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            value={orgData.subdomain}
            disabled
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            .app.com
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          El subdominio no puede ser modificado
        </p>
      </div>

      {/* Primary color picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('organization.primary_color')}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {colorPresets.map(color => (
              <button
                key={color}
                onClick={() => {
                  setOrgData({...orgData, primaryColor: color});
                  setIsDirty(true);
                }}
                className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform ${
                  orgData.primaryColor === color
                    ? 'border-gray-900 dark:border-white shadow-lg'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                disabled={!canUpdateSettings()}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: orgData.primaryColor }}
            />
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {orgData.primaryColor}
            </span>
          </div>
        </div>
      </div>

      {/* Current plan info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('organization.current_plan')}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              Professional
            </p>
          </div>
          <button className="btn btn-primary text-sm">
            {t('organization.manage_subscription')}
          </button>
        </div>
      </div>

      {/* Actions */}
      {canUpdateSettings() && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="btn btn-secondary" onClick={handleCancel}>
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

export default OrganizationSettings;
