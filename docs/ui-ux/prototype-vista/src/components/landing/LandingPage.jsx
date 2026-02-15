import { useState, useEffect } from 'react';
import { Eye, Edit2, Layout, Globe } from 'lucide-react';
import { LandingPreview } from './LandingPreview';
import { LandingEditor } from './LandingEditor';
import { TemplateSelector } from './TemplateSelector';
import { getLandingPageByUser, createDefaultLandingPage } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

export const LandingPage = () => {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState('preview'); // preview | edit | templates
  const [landingData, setLandingData] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
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
    setMode('preview');
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
    setMode('preview');
    // TODO: In real app, call API to save template change
  };

  const publicURL = `${window.location.origin}/landing/${currentUser.username}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Landing Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea tu página de aterrizaje profesional
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('preview')}
            className={`btn ${mode === 'preview' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Vista Previa</span>
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`btn ${mode === 'edit' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            onClick={() => setMode('templates')}
            className={`btn ${mode === 'templates' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Plantillas</span>
          </button>
        </div>
      </div>

      {/* Public URL Section */}
      <div className="card card-body mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">URL Pública</p>
              <a
                href={publicURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                {publicURL}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${landingData.isPublished ? 'badge-success' : 'badge-warning'}`}>
              {landingData.isPublished ? 'Publicado' : 'Borrador'}
            </span>
            <button
              onClick={handlePublish}
              className="btn-secondary text-sm"
            >
              {landingData.isPublished ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

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
          onCancel={() => setMode('preview')}
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
