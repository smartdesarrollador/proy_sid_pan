import { useAuth } from '../contexts/AuthContext';
import { featuresByPlan, normalizePlanName, getFeatureInfo } from '../data/featureGates';

export const useFeatureGate = () => {
  const { currentPlan } = useAuth();
  const normalizedPlan = normalizePlanName(currentPlan);
  const planFeatures = featuresByPlan[normalizedPlan];

  const hasFeature = (featureName) => {
    return planFeatures[featureName] === true;
  };

  const getFeatureLimit = (featureName) => {
    const value = planFeatures[featureName];
    if (value === true) return Infinity;
    if (value === false) return 0;
    return value || 0;
  };

  const canPerformAction = (featureName, currentCount = 0) => {
    const limit = getFeatureLimit(featureName);
    if (limit === Infinity) return true;
    return currentCount < limit;
  };

  const getUpgradeMessage = (featureName) => {
    return getFeatureInfo(featureName);
  };

  return {
    currentPlan: normalizedPlan,
    planFeatures,
    hasFeature,
    getFeatureLimit,
    canPerformAction,
    getUpgradeMessage,
    getFeatureInfo,
  };
};
