import { useTranslation } from 'react-i18next';
import { landingPageData } from '../../../data/mockData';
import FAQItem from '../components/FAQItem';

function FAQSection() {
  const { t } = useTranslation('landing');

  // Map FAQ IDs to translation keys
  const getFAQTranslation = (faqId) => {
    const mapping = {
      'faq-1': 'faq1',
      'faq-2': 'faq2',
      'faq-3': 'faq3',
      'faq-4': 'faq4',
      'faq-5': 'faq5',
      'faq-6': 'faq6'
    };
    return mapping[faqId] || 'faq1';
  };

  return (
    <section id="faq" className="py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {landingPageData.faqs.map((faq, index) => {
            const translationKey = getFAQTranslation(faq.id);
            const translatedFAQ = {
              ...faq,
              question: t(`faq.items.${translationKey}.question`),
              answer: t(`faq.items.${translationKey}.answer`)
            };
            return (
              <FAQItem
                key={faq.id}
                faq={translatedFAQ}
                isLast={index === landingPageData.faqs.length - 1}
              />
            );
          })}
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {t('faq.contactSupport')}{' '}
            <a href="mailto:support@example.com" className="text-primary-600 font-medium hover:text-primary-700">
              {t('faq.contactLink')}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
