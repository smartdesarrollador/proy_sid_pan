import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import PromotionCard from '../components/PromotionCard';

function PromotionsSection({ promotions }) {
  const { t } = useTranslation('landing');

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">
              {t('promotions.badge')}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('promotions.heading')}
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('promotions.subheading')}
          </p>
        </div>

        {/* Grid de Promociones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promotion, index) => (
            <PromotionCard key={index} promotion={promotion} />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {t('promotions.note')}
          </p>
        </div>
      </div>
    </section>
  );
}

export default PromotionsSection;
