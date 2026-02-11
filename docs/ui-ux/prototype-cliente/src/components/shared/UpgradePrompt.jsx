import { Lock, ArrowRight } from 'lucide-react';

export const UpgradePrompt = ({ feature, requiredPlan, title, message, onUpgrade }) => {
  const planNames = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise'
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default: mostrar alert (en producción sería navegar a billing)
      alert(`Actualiza al plan ${planNames[requiredPlan] || 'superior'} para desbloquear esta funcionalidad.`);
    }
  };

  return (
    <div className="card p-6 text-center max-w-md mx-auto">
      <div className="mb-4 flex justify-center">
        <div className="p-3 bg-primary-100 rounded-full">
          <Lock className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || 'Funcionalidad bloqueada'}
      </h3>

      <p className="text-gray-600 mb-4">
        {message || 'Esta funcionalidad no está disponible en tu plan actual.'}
      </p>

      {feature && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Incluido en:</span>{' '}
            Plan {planNames[requiredPlan] || 'superior'}
          </p>
        </div>
      )}

      <button
        onClick={handleUpgrade}
        className="btn btn-primary inline-flex items-center gap-2"
      >
        Actualizar Plan
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
