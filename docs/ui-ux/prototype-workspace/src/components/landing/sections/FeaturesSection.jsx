import { useTranslation } from 'react-i18next';
import { landingPageData } from '../../../data/mockData';
import FeatureCard from '../components/FeatureCard';

function FeaturesSection() {
  const { t } = useTranslation('landing');

  // Map feature IDs to translation keys
  const getFeatureTranslation = (featureId) => {
    const mapping = {
      'feature-1': 'rbac',
      'feature-2': 'tasks',
      'feature-3': 'calendar',
      'feature-4': 'projects',
      'feature-5': 'sharing',
      'feature-6': 'audit'
    };
    return mapping[featureId] || 'rbac';
  };

  return (
    <section id="features" className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {landingPageData.features.map((feature) => {
            const translationKey = getFeatureTranslation(feature.id);
            return (
              <FeatureCard
                key={feature.id}
                icon={feature.icon}
                title={t(`features.items.${translationKey}.title`)}
                description={t(`features.items.${translationKey}.description`)}
                color={feature.color}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
