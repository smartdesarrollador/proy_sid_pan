import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

const templates = [
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Profesional y limpio con fondo azul sólido',
    requiredPlan: 'starter',
    preview: {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-50',
      text: 'Ideal para empresas y profesionales',
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Colorido y moderno con gradientes vibrantes',
    requiredPlan: 'starter',
    preview: {
      primary: 'bg-gradient-to-r from-purple-500 to-pink-500',
      secondary: 'bg-gray-50',
      text: 'Ideal para creativos y diseñadores',
    },
  },
];

export const TemplateSelector = ({ currentTemplate, onSelect }) => {
  const { getFeatureLimit, getUpgradeMessage } = useFeatureGate();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedUpgradeFeature, setSelectedUpgradeFeature] = useState(null);

  const templateLimit = getFeatureLimit('landingTemplates');
  const canUseTemplate = templateLimit > 0;

  const handleSelectTemplate = (templateId) => {
    if (!canUseTemplate) {
      setSelectedUpgradeFeature('landingPage');
      setShowUpgrade(true);
      return;
    }

    if (confirm(`¿Cambiar a la plantilla ${templates.find(t => t.id === templateId)?.name}?`)) {
      onSelect(templateId);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Plantillas de Diseño
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Selecciona una plantilla para cambiar el estilo de tu landing page
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((template) => {
          const isSelected = currentTemplate === template.id;
          const isAvailable = canUseTemplate;

          return (
            <div
              key={template.id}
              className={`card card-hover card-body relative ${
                isSelected ? 'ring-2 ring-primary-500' : ''
              } ${!isAvailable ? 'opacity-60' : ''}`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              {/* Lock Badge */}
              {!isAvailable && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="mb-4">
                <div className={`${template.preview.primary} h-24 rounded-lg mb-2`} />
                <div className={`${template.preview.secondary} dark:bg-gray-700 h-16 rounded-lg`} />
              </div>

              {/* Info */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {template.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                {template.preview.text}
              </p>

              {/* Action Button */}
              <button
                onClick={() => handleSelectTemplate(template.id)}
                disabled={isSelected}
                className={`btn w-full ${
                  isSelected
                    ? 'btn-secondary cursor-not-allowed'
                    : isAvailable
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {isSelected ? 'Plantilla Actual' : isAvailable ? 'Seleccionar' : 'Requiere Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Upgrade Info */}
      {!canUseTemplate && (
        <div className="mt-6 card card-body bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Plan Starter o superior requerido</strong> para usar plantillas de landing page.
            Actualiza tu plan para desbloquear esta funcionalidad.
          </p>
        </div>
      )}

      {/* Template Info */}
      <div className="mt-6 card card-body bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Límite de Plantillas por Plan
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Free: Sin acceso a landing pages</li>
          <li>• Starter: 3 plantillas disponibles</li>
          <li>• Professional: Plantillas ilimitadas</li>
          <li>• Enterprise: Plantillas ilimitadas + personalización CSS</li>
        </ul>
      </div>

      {/* Upgrade Prompt */}
      {showUpgrade && selectedUpgradeFeature && (
        <UpgradePrompt
          isOpen={showUpgrade}
          onClose={() => {
            setShowUpgrade(false);
            setSelectedUpgradeFeature(null);
          }}
          featureInfo={getUpgradeMessage(selectedUpgradeFeature)}
        />
      )}
    </div>
  );
};
