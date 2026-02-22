import { useState, useEffect } from 'react';
import { Globe, Layout, Link, Copy, Check, ExternalLink } from 'lucide-react';
import { LandingPreview } from './LandingPreview';
import { LandingEditor } from './LandingEditor';
import { TemplateSelector } from './TemplateSelector';
import { getLandingPageByUser, createDefaultLandingPage } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

export const LandingPage = ({ mode = 'preview', onModeChange }) => {
  const { currentUser } = useAuth();
  const [landingData, setLandingData] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  // Load user-specific data on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      let userData = getLandingPageByUser(currentUser.id);
      if (!userData) {
        // Create default landing page for new users
        userData = createDefaultLandingPage(currentUser.id);
      }
      setLandingData(userData);
    }
  }, [currentUser]);

  // Check if user has access to landing page feature
  useEffect(() => {
    if (!hasFeature('landingPage')) {
      setShowUpgrade(true);
    }
  }, [hasFeature]);

  // Show loading while data is being fetched
  if (!landingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando landing page...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access, show upgrade prompt
  if (!hasFeature('landingPage')) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Landing Page
        </h1>
        <div className="card card-body text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Landing Page Profesional
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Crea una página de aterrizaje completa con múltiples secciones y formulario de contacto.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="btn-primary mx-auto"
          >
            Actualizar Plan
          </button>
        </div>

        {/* Upgrade Prompt */}
        {showUpgrade && (
          <UpgradePrompt
            isOpen={showUpgrade}
            onClose={() => setShowUpgrade(false)}
            featureInfo={getUpgradeMessage('landingPage')}
          />
        )}
      </div>
    );
  }

  const handleSave = (newData) => {
    setLandingData(prev => ({
      ...prev,
      ...newData,
    }));
    if (onModeChange) onModeChange('preview');
    // TODO: In real app, call API to save changes
  };

  const handlePublish = () => {
    setLandingData(prev => ({
      ...prev,
      isPublished: !prev.isPublished,
    }));
    // TODO: In real app, call API to toggle publish status
  };

  const handleTemplateChange = (template) => {
    setLandingData(prev => ({
      ...prev,
      template,
    }));
    if (onModeChange) onModeChange('preview');
    // TODO: In real app, call API to save template change
  };

  const publicURL = `${window.location.origin}/landing/${currentUser.username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar la URL');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(publicURL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Landing Page
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crea tu página de aterrizaje profesional
        </p>
      </div>

      {/* Public URL Section */}
      {landingData.isPublished ? (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Link className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  URL Pública
                </p>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">Publicado</span>
                  <button onClick={handlePublish} className="btn-secondary text-sm">
                    Despublicar
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white font-mono truncate">
                  {publicURL}
                </code>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    title="Copiar URL"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                    title="Abrir landing page pública"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Abrir</span>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Comparte este enlace para que otros puedan ver tu landing page sin necesidad de iniciar sesión
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Landing page no publicada
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Publica tu landing page para generar una URL pública compartible
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-warning">Borrador</span>
                  <button onClick={handlePublish} className="btn-secondary text-sm">
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {mode === 'preview' && (
        <LandingPreview
          landingData={landingData}
          template={landingData.template}
        />
      )}

      {mode === 'edit' && (
        <LandingEditor
          landingData={landingData}
          onSave={handleSave}
          onCancel={() => onModeChange && onModeChange('preview')}
        />
      )}

      {mode === 'templates' && (
        <TemplateSelector
          currentTemplate={landingData.template}
          onSelect={handleTemplateChange}
        />
      )}
    </div>
  );
};
