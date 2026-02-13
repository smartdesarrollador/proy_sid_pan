import { X, Sparkles } from 'lucide-react';
import { getPlanDisplayName } from '../../data/featureGates';

export const UpgradePrompt = ({ isOpen, onClose, featureInfo }) => {
  if (!isOpen) return null;

  const { title, message, requiredPlan } = featureInfo;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-primary-800 dark:text-primary-200">
              Esta función está disponible en el plan{' '}
              <strong>{getPlanDisplayName(requiredPlan)}</strong> y superiores.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button className="btn-primary">
            Actualizar Plan
          </button>
        </div>
      </div>
    </div>
  );
};
