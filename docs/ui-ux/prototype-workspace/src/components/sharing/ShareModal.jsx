import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  ChevronDown,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle,
  Trash2,
  Info
} from 'lucide-react';
import { useSharing } from '../../hooks/useSharing';
import ShareAccessLevelBadge from './ShareAccessLevelBadge';
import InheritedPermissionBadge from './InheritedPermissionBadge';
import PermissionsTable from './PermissionsTable';
import { getAccessLevelDisplayName } from '../../data/mockData';

/**
 * Modal para compartir elementos y gestionar permisos
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - resourceType: string
 * - resourceId: string
 * - resourceName: string
 * - currentPlan: string
 * - onShareSuccess: function (opcional)
 */
export default function ShareModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  currentPlan = 'professional',
  onShareSuccess
}) {
  // Sharing hook
  const {
    shares,
    isLoading,
    error,
    shareElement,
    updateAccessLevel,
    revokeAccess,
    getAvailableUsersToShare,
    shareLimit,
    currentShareCount,
    isAtShareLimit,
    canSetExpirationDate,
    canDelegateShareRights,
    availableAccessLevels
  } = useSharing(resourceType, resourceId, resourceName, currentPlan);

  // Form state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [accessLevel, setAccessLevel] = useState('viewer');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [showPermissionsTable, setShowPermissionsTable] = useState(false);

  // UI state
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Available users to share with
  const availableUsers = getAvailableUsersToShare();

  // Reset form after successful share
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Initialize access level with first available
  useEffect(() => {
    if (availableAccessLevels.length > 0 && !availableAccessLevels.includes(accessLevel)) {
      setAccessLevel(availableAccessLevels[0]);
    }
  }, [availableAccessLevels]);

  if (!isOpen) return null;

  // Handle share submit
  const handleShare = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (selectedUsers.length === 0) {
      setLocalError('Selecciona al menos un usuario');
      return;
    }

    const options = {
      message: message.trim() || null,
      expiresAt: expiresAt || null,
      notifyUsers
    };

    const result = await shareElement(selectedUsers, accessLevel, options);

    if (result.success) {
      setSuccessMessage(result.message);
      setSelectedUsers([]);
      setMessage('');
      setExpiresAt('');
      setIsUserDropdownOpen(false);

      if (onShareSuccess) {
        onShareSuccess();
      }
    } else {
      setLocalError(result.error);
    }
  };

  // Handle change access level of existing share
  const handleChangeAccessLevel = async (shareId, newLevel) => {
    const result = await updateAccessLevel(shareId, newLevel);
    if (!result.success) {
      setLocalError(result.error);
    } else {
      setSuccessMessage('Nivel de acceso actualizado');
    }
  };

  // Handle revoke access
  const handleRevokeAccess = async (shareId) => {
    if (!confirm('¿Estás seguro de revocar el acceso a este usuario?')) {
      return;
    }

    const result = await revokeAccess(shareId);
    if (!result.success) {
      setLocalError(result.error);
    } else {
      setSuccessMessage('Acceso revocado correctamente');
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Get user name for display
  const getUserName = (userId) => {
    const user = availableUsers.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Compartir elemento</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{resourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Error Alert */}
          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error || localError}</p>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4 mb-6">
            {/* User Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Compartir con usuarios *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  disabled={isAtShareLimit}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {selectedUsers.length === 0
                      ? 'Seleccionar usuarios...'
                      : `${selectedUsers.length} usuario(s) seleccionado(s)`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No hay usuarios disponibles para compartir
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Límite: {currentShareCount} / {shareLimit === Infinity ? '∞' : shareLimit} usuarios
              </p>
            </div>

            {/* Access Level Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nivel de acceso *
                <button
                  type="button"
                  onClick={() => setShowPermissionsTable(!showPermissionsTable)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  <span className="text-xs">Ver permisos</span>
                </button>
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                {availableAccessLevels.map((level) => (
                  <option key={level} value={level}>
                    {getAccessLevelDisplayName(level)}
                  </option>
                ))}
              </select>

              {/* Permissions Table (collapsible) */}
              {showPermissionsTable && (
                <div className="mt-3">
                  <PermissionsTable resourceType={resourceType} compact={true} />
                </div>
              )}
            </div>

            {/* Message (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Mensaje personalizado (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Agrega un mensaje para los usuarios..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Expiration Date (Professional+) */}
            {canSetExpirationDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Fecha de expiración (opcional)
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                    Professional
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El acceso se revocará automáticamente en esta fecha
                </p>
              </div>
            )}

            {/* Notify Users Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyUsers"
                checked={notifyUsers}
                onChange={(e) => setNotifyUsers(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="notifyUsers" className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                Notificar a los usuarios por email
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || selectedUsers.length === 0}
              className="w-full px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compartiendo...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Compartir elemento</span>
                </>
              )}
            </button>
          </form>

          {/* Current Shares */}
          {shares.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Usuarios con acceso ({shares.length})
              </h3>
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    {/* User Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{share.sharedWithName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{share.sharedWithEmail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <ShareAccessLevelBadge level={share.accessLevel} size="sm" />
                        {share.isInherited && (
                          <InheritedPermissionBadge
                            isInherited={share.isInherited}
                            parentResourceType={share.parentResourceType}
                            parentResourceName={share.parentResourceName}
                          />
                        )}
                        {share.expiresAt && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            Expira: {new Date(share.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions (only for non-inherited shares) */}
                    {!share.isInherited && (
                      <div className="flex items-center gap-2 ml-4">
                        {/* Change Access Level */}
                        <select
                          value={share.accessLevel}
                          onChange={(e) => handleChangeAccessLevel(share.id, e.target.value)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        >
                          {availableAccessLevels.map((level) => (
                            <option key={level} value={level}>
                              {getAccessLevelDisplayName(level)}
                            </option>
                          ))}
                        </select>

                        {/* Revoke Button */}
                        <button
                          onClick={() => handleRevokeAccess(share.id)}
                          disabled={isLoading}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Revocar acceso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
