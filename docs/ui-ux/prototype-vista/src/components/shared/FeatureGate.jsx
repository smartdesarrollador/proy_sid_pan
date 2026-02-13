import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

export const FeatureGate = ({
  featureName,
  children,
  fallback = null,
  showUpgradePrompt = true,
}) => {
  const { hasFeature, getUpgradeMessage } = useFeatureGate();
  const [showPrompt, setShowPrompt] = useState(false);

  const isFeatureAvailable = hasFeature(featureName);

  if (isFeatureAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const featureInfo = getUpgradeMessage(featureName);

  return (
    <>
      <div
        onClick={() => setShowPrompt(true)}
        className="relative cursor-pointer group"
      >
        <div className="pointer-events-none opacity-50 blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-primary-500">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Función Premium</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Haz clic para conocer más
            </p>
          </div>
        </div>
      </div>
      <UpgradePrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        featureInfo={featureInfo}
      />
    </>
  );
};
