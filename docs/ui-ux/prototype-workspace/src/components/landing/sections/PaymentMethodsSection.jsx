import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { landingPageData } from '../../../data/mockData';
import PaymentBadge from '../components/PaymentBadge';

function PaymentMethodsSection() {
  const { t } = useTranslation('landing');

  // Map payment method IDs to translation keys
  const getPaymentTranslation = (methodId) => {
    const mapping = {
      'payment-1': 'stripe',
      'payment-2': 'cards',
      'payment-3': 'paypal',
      'payment-4': 'transfer'
    };
    return mapping[methodId] || 'stripe';
  };

  return (
    <section id="payment-methods" className="py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('paymentMethods.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('paymentMethods.subtitle')}
          </p>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {landingPageData.paymentMethods.map((method) => {
            const translationKey = getPaymentTranslation(method.id);
            const translatedMethod = {
              ...method,
              name: t(`paymentMethods.methods.${translationKey}.name`),
              description: t(`paymentMethods.methods.${translationKey}.description`)
            };
            return <PaymentBadge key={method.id} method={translatedMethod} />;
          })}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="font-medium">{t('paymentMethods.securityBadge')}</span>
        </div>
      </div>
    </section>
  );
}

export default PaymentMethodsSection;
