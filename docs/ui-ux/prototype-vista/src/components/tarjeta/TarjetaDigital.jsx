import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { TarjetaPreview } from './TarjetaPreview';
import { TarjetaEditor } from './TarjetaEditor';
import { AnalyticsPanel } from './AnalyticsPanel';
import { PublicURLSection } from './PublicURLSection';
import { getDigitalCardByUser, createDefaultCard } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

export const TarjetaDigital = ({ mode = 'preview', onModeChange }) => {
  const { currentUser } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  // Load user-specific data on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      let userData = getDigitalCardByUser(currentUser.id);
      if (!userData) {
        // Create default card for new users
        userData = createDefaultCard(currentUser.id);
      }
      setCardData(userData);
    }
  }, [currentUser]);

  // Guard analytics mode: redirect to preview if no feature access
  useEffect(() => {
    if (mode === 'analytics' && !hasFeature('digitalCardAnalytics')) {
      setShowUpgrade(true);
      if (onModeChange) onModeChange('preview');
    }
  }, [mode, hasFeature, onModeChange]);

  // Show loading while data is being fetched
  if (!cardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando tarjeta digital...</p>
        </div>
      </div>
    );
  }

  const handleSave = (newData) => {
    setCardData(prev => ({
      ...prev,
      ...newData,
    }));
    if (onModeChange) onModeChange('preview');
    // TODO: In real app, call API to save changes
  };

  const handleShare = async () => {
    const publicURL = `${window.location.origin}/tarjeta/${currentUser.username}`;

    const shareData = {
      title: `${cardData.profile.displayName} - ${cardData.profile.title}`,
      text: cardData.profile.about,
      url: publicURL,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy public URL to clipboard
      await navigator.clipboard.writeText(publicURL);
      alert('URL pública copiada al portapapeles');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Tarjeta Digital
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comparte tu información de contacto con un código QR
        </p>
      </div>

      {/* Public URL Section */}
      <PublicURLSection
        username={currentUser.username}
        isPublished={cardData?.isPublished || false}
      />

      {/* Content */}
      {mode === 'preview' && (
        <TarjetaPreview cardData={cardData} onShare={handleShare} />
      )}

      {mode === 'edit' && (
        <TarjetaEditor
          cardData={cardData}
          onSave={handleSave}
          onCancel={() => onModeChange && onModeChange('preview')}
        />
      )}

      {mode === 'analytics' && (
        <AnalyticsPanel cardData={cardData} />
      )}

      {/* Upgrade Prompt */}
      {showUpgrade && (
        <UpgradePrompt
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          featureInfo={getUpgradeMessage('digitalCardAnalytics')}
        />
      )}
    </div>
  );
};
