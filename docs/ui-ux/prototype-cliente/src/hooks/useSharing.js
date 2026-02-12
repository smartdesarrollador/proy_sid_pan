import { useState, useEffect, useCallback } from 'react';
import {
  shares as initialShares,
  getSharesByResource,
  getSharedWithMeItems,
  getUsersWithAccessToResource,
  hasAccessLevel,
  calculateEffectivePermission,
  isShareExpired,
  filterActiveShares,
  currentUser,
  users
} from '../data/mockData';
import { featuresByPlan, normalizePlanName } from '../data/featureGates';

/**
 * Custom hook para gestionar compartición de elementos
 *
 * @param {string} resourceType - Tipo de recurso ('project', 'task', 'event', etc.)
 * @param {string} resourceId - ID del recurso
 * @param {string} resourceName - Nombre del recurso (opcional)
 * @param {string} currentPlan - Plan de suscripción actual (default: 'professional')
 * @returns {Object} - API del hook
 */
export function useSharing(
  resourceType,
  resourceId,
  resourceName = '',
  currentPlan = 'professional'
) {
  // State
  const [shares, setShares] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Feature gates
  const normalizedPlan = normalizePlanName(currentPlan);
  const planFeatures = featuresByPlan[normalizedPlan] || featuresByPlan.free;

  // Load shares on mount
  useEffect(() => {
    if (resourceType && resourceId) {
      loadShares();
    }
    loadSharedWithMe();
  }, [resourceType, resourceId]);

  /**
   * Load shares for current resource
   */
  const loadShares = useCallback(() => {
    setIsLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      try {
        const resourceShares = getSharesByResource(resourceType, resourceId);
        const activeShares = filterActiveShares(resourceShares);
        setShares(activeShares);
      } catch (err) {
        setError('Error al cargar shares');
        console.error('Error loading shares:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [resourceType, resourceId]);

  /**
   * Load items shared with current user
   */
  const loadSharedWithMe = useCallback(() => {
    const items = getSharedWithMeItems(currentUser.id);
    const activeItems = filterActiveShares(items);
    setSharedWithMe(activeItems);
  }, []);

  /**
   * Share element with users
   * @param {Array<string>} userIds - Array of user IDs to share with
   * @param {string} accessLevel - Access level ('viewer', 'commenter', 'editor', 'admin')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  const shareElement = useCallback(
    async (userIds, accessLevel, options = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate feature gate
        if (!planFeatures.canShareElements) {
          throw new Error('Tu plan no permite compartir elementos. Actualiza a Plan Starter o superior.');
        }

        // Validate access level is allowed in plan
        if (!planFeatures.shareAccessLevels.includes(accessLevel)) {
          throw new Error(
            `El nivel de acceso "${accessLevel}" no está disponible en tu plan. ` +
            `Niveles permitidos: ${planFeatures.shareAccessLevels.join(', ')}`
          );
        }

        // Validate limit
        const currentSharesCount = shares.length;
        const newSharesCount = currentSharesCount + userIds.length;

        if (newSharesCount > planFeatures.maxSharedUsersPerElement) {
          throw new Error(
            `Límite alcanzado: puedes compartir con máximo ${planFeatures.maxSharedUsersPerElement} usuarios. ` +
            `Actualmente tienes ${currentSharesCount} shares activos.`
          );
        }

        // Validate expiration date (Professional+)
        if (options.expiresAt && !planFeatures.canSetExpirationDate) {
          throw new Error('La fecha de expiración solo está disponible en Plan Professional o superior.');
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create new shares
        const newShares = userIds.map(userId => {
          const user = users.find(u => u.id === userId);
          return {
            id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            resourceType,
            resourceId,
            resourceName,
            sharedWith: userId,
            sharedWithName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
            sharedWithEmail: user?.email || '',
            sharedBy: currentUser.id,
            sharedByName: `${currentUser.firstName} ${currentUser.lastName}`,
            accessLevel,
            isInherited: false,
            message: options.message || null,
            expiresAt: options.expiresAt || null,
            canDelegate: options.canDelegate && planFeatures.canDelegateShareRights ? true : false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        // Update mock data (in real app, this would be API call)
        initialShares.push(...newShares);

        // Update local state
        setShares(prev => [...prev, ...newShares]);

        return {
          success: true,
          shares: newShares,
          message: `Compartido con ${userIds.length} usuario(s)`
        };
      } catch (err) {
        setError(err.message);
        return {
          success: false,
          error: err.message
        };
      } finally {
        setIsLoading(false);
      }
    },
    [resourceType, resourceId, resourceName, shares, planFeatures]
  );

  /**
   * Update access level of an existing share
   * @param {string} shareId - Share ID
   * @param {string} newAccessLevel - New access level
   * @returns {Promise<Object>}
   */
  const updateAccessLevel = useCallback(
    async (shareId, newAccessLevel) => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate access level is allowed in plan
        if (!planFeatures.shareAccessLevels.includes(newAccessLevel)) {
          throw new Error(
            `El nivel de acceso "${newAccessLevel}" no está disponible en tu plan.`
          );
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 400));

        // Find and update share
        const shareIndex = initialShares.findIndex(s => s.id === shareId);
        if (shareIndex === -1) {
          throw new Error('Share no encontrado');
        }

        initialShares[shareIndex] = {
          ...initialShares[shareIndex],
          accessLevel: newAccessLevel,
          updatedAt: new Date().toISOString()
        };

        // Update local state
        setShares(prev =>
          prev.map(share =>
            share.id === shareId
              ? { ...share, accessLevel: newAccessLevel, updatedAt: new Date().toISOString() }
              : share
          )
        );

        return {
          success: true,
          message: 'Nivel de acceso actualizado'
        };
      } catch (err) {
        setError(err.message);
        return {
          success: false,
          error: err.message
        };
      } finally {
        setIsLoading(false);
      }
    },
    [planFeatures]
  );

  /**
   * Revoke access (delete share)
   * @param {string} shareId - Share ID
   * @returns {Promise<Object>}
   */
  const revokeAccess = useCallback(async (shareId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));

      // Remove from mock data
      const shareIndex = initialShares.findIndex(s => s.id === shareId);
      if (shareIndex === -1) {
        throw new Error('Share no encontrado');
      }

      initialShares.splice(shareIndex, 1);

      // Update local state
      setShares(prev => prev.filter(share => share.id !== shareId));

      return {
        success: true,
        message: 'Acceso revocado'
      };
    } catch (err) {
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if current user can share this resource
   */
  const canShare = useCallback(() => {
    return planFeatures.canShareElements;
  }, [planFeatures]);

  /**
   * Check if a specific user has access to the resource
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  const hasAccess = useCallback(
    (userId) => {
      return shares.some(share => share.sharedWith === userId);
    },
    [shares]
  );

  /**
   * Get effective permission for a user (considers inheritance)
   * @param {string} userId - User ID
   * @returns {Object|null}
   */
  const getEffectivePermission = useCallback(
    (userId) => {
      return calculateEffectivePermission(userId, resourceType, resourceId);
    },
    [resourceType, resourceId]
  );

  /**
   * Get all users with access to resource
   * @returns {Array}
   */
  const getUsersWithAccess = useCallback(() => {
    return getUsersWithAccessToResource(resourceType, resourceId);
  }, [resourceType, resourceId]);

  /**
   * Get share limit for current plan
   * @returns {number}
   */
  const getShareLimit = useCallback(() => {
    return planFeatures.maxSharedUsersPerElement;
  }, [planFeatures]);

  /**
   * Check if at share limit
   * @returns {boolean}
   */
  const isAtShareLimit = useCallback(() => {
    const limit = planFeatures.maxSharedUsersPerElement;
    if (limit === Infinity) return false;
    return shares.length >= limit;
  }, [shares, planFeatures]);

  /**
   * Get available users to share with (excludes already shared + current user)
   * @returns {Array}
   */
  const getAvailableUsersToShare = useCallback(() => {
    const sharedUserIds = shares.map(s => s.sharedWith);
    return users.filter(
      user => user.id !== currentUser.id && !sharedUserIds.includes(user.id) && user.status === 'active'
    );
  }, [shares]);

  /**
   * Refresh shares from mock data
   */
  const refreshShares = useCallback(() => {
    loadShares();
    loadSharedWithMe();
  }, [loadShares, loadSharedWithMe]);

  return {
    // Data
    shares,
    sharedWithMe,
    isLoading,
    error,

    // Actions
    shareElement,
    updateAccessLevel,
    revokeAccess,
    refreshShares,

    // Queries
    canShare: canShare(),
    hasAccess,
    getEffectivePermission,
    getUsersWithAccess,
    getAvailableUsersToShare,

    // Limits
    getShareLimit,
    isAtShareLimit: isAtShareLimit(),
    shareLimit: planFeatures.maxSharedUsersPerElement,
    currentShareCount: shares.length,

    // Feature flags
    canSetExpirationDate: planFeatures.canSetExpirationDate,
    canDelegateShareRights: planFeatures.canDelegateShareRights,
    canShareGroups: planFeatures.canShareGroups,
    canCreateExternalLinks: planFeatures.canCreateExternalLinks,
    availableAccessLevels: planFeatures.shareAccessLevels
  };
}
