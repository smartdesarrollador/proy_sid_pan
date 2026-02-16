import { useState } from 'react';
import { Shield, Smartphone, Monitor, LogOut, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../hooks/usePermissions';
import { securitySettings as mockSecuritySettings } from '../../data/mockData';
import clsx from 'clsx';

function SecuritySettings() {
  const { t } = useTranslation('settings');
  const { canUpdateSettings } = usePermissions();

  const [mfaEnabled, setMfaEnabled] = useState(mockSecuritySettings.mfaEnabled);
  const [sessions, setSessions] = useState(mockSecuritySettings.sessions);

  const handleToggleMFA = () => {
    if (mfaEnabled) {
      if (confirm(t('security.disable_mfa_confirm'))) {
        setMfaEnabled(false);
      }
    } else {
      setMfaEnabled(true);
      alert('En producción, aquí se iniciaría el proceso de configuración de MFA con QR code.');
    }
  };

  const handleRevokeSession = (sessionId) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    alert(t('security.session_revoked'));
  };

  const handleSignOutAll = () => {
    if (confirm(t('security.sign_out_all_confirm'))) {
      setSessions(sessions.filter(s => s.isCurrent));
      alert(t('security.signed_out_all'));
    }
  };

  const getDeviceIcon = (device) => {
    if (device.includes('iPhone') || device.includes('Safari')) {
      return Smartphone;
    }
    return Monitor;
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('security.title')}
        </h2>
      </div>

      {/* MFA Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('security.mfa_title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('security.mfa_description')}
              </p>
              {mfaEnabled && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {t('security.mfa_enabled')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleMFA}
            disabled={!canUpdateSettings()}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              mfaEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                mfaEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {t('security.active_sessions')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('security.active_sessions_desc')}
            </p>
          </div>
          {sessions.length > 1 && canUpdateSettings() && (
            <button
              onClick={handleSignOutAll}
              className="btn btn-secondary text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('security.sign_out_all')}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map(session => {
            const DeviceIcon = getDeviceIcon(session.device);
            return (
              <div
                key={session.id}
                className={clsx(
                  'flex items-center justify-between p-4 rounded-lg border',
                  session.isCurrent
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-start gap-3">
                  <DeviceIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.device}
                      </p>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                          {t('security.current_session')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {t('security.last_active')}: {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && canUpdateSettings() && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    {t('security.revoke')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Password info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('security.password')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('security.last_changed')}: {mockSecuritySettings.lastPasswordChange}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettings;
