import { useState } from 'react';
import { User, Camera, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

function ProfileSettings() {
  const { t } = useTranslation('settings');
  const { currentUser } = useAuth();
  const { canUpdateSettings } = usePermissions();

  const [formData, setFormData] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    alert(t('profile.save_success'));
    setIsDirty(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email
    });
    setIsDirty(false);
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('profile.title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('profile.description')}
        </p>
      </div>

      {/* Avatar section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-600 dark:text-primary-300" />
          </div>
          {canUpdateSettings() && (
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        <div>
          <button className="btn btn-secondary text-sm" disabled={!canUpdateSettings()}>
            {t('profile.upload_avatar')}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            JPG, PNG max 2MB
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('profile.first_name')}
          </label>
          <input
            type="text"
            className="input"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({...formData, firstName: e.target.value});
              setIsDirty(true);
            }}
            disabled={!canUpdateSettings()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('profile.last_name')}
          </label>
          <input
            type="text"
            className="input"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({...formData, lastName: e.target.value});
              setIsDirty(true);
            }}
            disabled={!canUpdateSettings()}
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
          value={formData.email}
          onChange={(e) => {
            setFormData({...formData, email: e.target.value});
            setIsDirty(true);
          }}
          disabled={!canUpdateSettings()}
        />
      </div>

      {/* Password change section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          onClick={() => setShowPasswordFields(!showPasswordFields)}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canUpdateSettings()}
        >
          <Key className="w-4 h-4" />
          {t('profile.change_password')}
        </button>
        {showPasswordFields && (
          <div className="mt-4 space-y-4">
            <input
              type="password"
              placeholder={t('profile.current_password')}
              className="input"
              disabled={!canUpdateSettings()}
            />
            <input
              type="password"
              placeholder={t('profile.new_password')}
              className="input"
              disabled={!canUpdateSettings()}
            />
            <input
              type="password"
              placeholder={t('profile.confirm_password')}
              className="input"
              disabled={!canUpdateSettings()}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {canUpdateSettings() && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="btn btn-secondary" onClick={handleCancel}>
            {t('common:cancel', 'Cancelar')}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!isDirty}>
            {t('common:save', 'Guardar cambios')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
