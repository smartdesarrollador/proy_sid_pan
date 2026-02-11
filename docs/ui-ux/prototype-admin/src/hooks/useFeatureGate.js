import { useAuth } from '../contexts/AuthContext';
import { featuresByPlan, upgradeMessages, normalizePlanName } from '../data/featureGates';

export const useFeatureGate = () => {
  const { currentTenant } = useAuth();

  // Obtener plan actual del tenant
  const currentPlan = normalizePlanName(currentTenant?.subscription?.plan || 'free');
  const planFeatures = featuresByPlan[currentPlan] || featuresByPlan.free;

  /**
   * Verifica si el plan actual incluye una feature
   * @param {string} featureName - Nombre de la feature (ej: 'kanbanView', 'recurringEvents')
   * @returns {boolean}
   */
  const hasFeature = (featureName) => {
    const featureValue = planFeatures[featureName];

    // Si es booleano, retornar directamente
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }

    // Si es número (límite), verificar que sea mayor a 0 o Infinity
    if (typeof featureValue === 'number') {
      return featureValue > 0 || featureValue === Infinity;
    }

    return false;
  };

  /**
   * Obtiene el límite numérico de una feature
   * @param {string} featureName - Nombre de la feature (ej: 'maxActiveTasks', 'maxEvents')
   * @returns {number|boolean}
   */
  const getFeatureLimit = (featureName) => {
    return planFeatures[featureName] ?? false;
  };

  /**
   * Verifica si se puede realizar una acción dado el uso actual
   * @param {string} featureName - Nombre de la feature
   * @param {number} currentCount - Uso actual (ej: cantidad de tareas activas)
   * @returns {boolean}
   */
  const canPerformAction = (featureName, currentCount) => {
    const limit = getFeatureLimit(featureName);

    // Si es booleano, verificar que sea true
    if (typeof limit === 'boolean') {
      return limit;
    }

    // Si es número, verificar que no se exceda el límite
    if (typeof limit === 'number') {
      if (limit === Infinity) return true;
      return currentCount < limit;
    }

    return false;
  };

  /**
   * Obtiene el mensaje de upgrade para una feature bloqueada
   * @param {string} featureName - Nombre de la feature
   * @returns {object} { title, message, feature, requiredPlan }
   */
  const getUpgradeMessage = (featureName) => {
    return upgradeMessages[featureName] || {
      title: 'Feature no disponible',
      message: 'Esta funcionalidad no está disponible en tu plan actual.',
      feature: 'Funcionalidad avanzada',
      requiredPlan: 'professional'
    };
  };

  /**
   * Obtiene el nombre display del plan requerido
   * @param {string} planName - Nombre del plan (lowercase)
   * @returns {string}
   */
  const getRequiredPlanName = (planName) => {
    const planNames = {
      free: 'Plan Gratuito',
      starter: 'Plan Starter',
      professional: 'Plan Professional',
      enterprise: 'Plan Enterprise'
    };
    return planNames[planName] || 'Plan superior';
  };

  /**
   * Obtiene información completa sobre una feature
   * @param {string} featureName - Nombre de la feature
   * @returns {object} { isAvailable, limit, upgradeMessage }
   */
  const getFeatureInfo = (featureName) => {
    const isAvailable = hasFeature(featureName);
    const limit = getFeatureLimit(featureName);
    const upgradeMessage = !isAvailable ? getUpgradeMessage(featureName) : null;

    return {
      isAvailable,
      limit,
      upgradeMessage
    };
  };

  return {
    currentPlan,
    planFeatures,
    hasFeature,
    getFeatureLimit,
    canPerformAction,
    getUpgradeMessage,
    getRequiredPlanName,
    getFeatureInfo
  };
};
