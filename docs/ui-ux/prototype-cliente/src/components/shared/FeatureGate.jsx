import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

export const FeatureGate = ({ children, feature, fallback, showUpgradePrompt = true }) => {
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  const isFeatureAvailable = hasFeature(feature);

  if (isFeatureAvailable) {
    return <>{children}</>;
  }

  // Si hay fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no mostrar upgrade prompt, retornar null
  if (!showUpgradePrompt) {
    return null;
  }

  // Mostrar UpgradePrompt por defecto
  const upgradeMessage = getUpgradeMessage(feature);

  return (
    <UpgradePrompt
      title={upgradeMessage.title}
      message={upgradeMessage.message}
      feature={upgradeMessage.feature}
      requiredPlan={upgradeMessage.requiredPlan}
    />
  );
};
