import { CreditCard, Globe, Briefcase, FileText, Lock } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { useState } from 'react';
import { UpgradePrompt } from '../shared/UpgradePrompt';

const ServiceCard = ({ icon: Icon, title, description, isLocked, onClick, onUpgrade }) => {
  return (
    <div
      onClick={isLocked ? onUpgrade : onClick}
      className={`card-hover p-6 relative ${isLocked ? 'opacity-75' : ''}`}
    >
      {isLocked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-5 h-5 text-yellow-500" />
        </div>
      )}
      <Icon className={`w-12 h-12 mb-4 ${isLocked ? 'text-gray-400' : 'text-primary-600'}`} />
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
      {isLocked && (
        <div className="mt-4">
          <span className="badge badge-warning">Requiere actualización</span>
        </div>
      )}
    </div>
  );
};

export const ServiceDashboard = ({ onSelectService }) => {
  const { hasFeature, getUpgradeMessage } = useFeatureGate();
  const [upgradePrompt, setUpgradePrompt] = useState(null);

  const services = [
    {
      id: 'tarjeta',
      icon: CreditCard,
      title: 'Tarjeta Digital',
      description: 'Comparte tu información de contacto con un código QR',
      featureName: 'digitalCard',
    },
    {
      id: 'landing',
      icon: Globe,
      title: 'Landing Page',
      description: 'Crea una página web profesional en minutos',
      featureName: 'landingPage',
    },
    {
      id: 'portafolio',
      icon: Briefcase,
      title: 'Portafolio Digital',
      description: 'Muestra tus proyectos y trabajos destacados',
      featureName: 'portfolio',
    },
    {
      id: 'cv',
      icon: FileText,
      title: 'CV Digital',
      description: 'Crea y exporta tu currículum vitae profesional',
      featureName: 'cv',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Servicios Digitales
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Crea tu presencia digital profesional con nuestras herramientas
        </p>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => {
          const isAvailable = hasFeature(service.featureName);
          return (
            <ServiceCard
              key={service.id}
              icon={service.icon}
              title={service.title}
              description={service.description}
              isLocked={!isAvailable}
              onClick={() => onSelectService(service.id)}
              onUpgrade={() => setUpgradePrompt(getUpgradeMessage(service.featureName))}
            />
          );
        })}
      </div>

      {/* Upgrade Prompt */}
      {upgradePrompt && (
        <UpgradePrompt
          isOpen={!!upgradePrompt}
          onClose={() => setUpgradePrompt(null)}
          featureInfo={upgradePrompt}
        />
      )}
    </div>
  );
};
