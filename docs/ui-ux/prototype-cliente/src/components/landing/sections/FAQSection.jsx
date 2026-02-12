import { landingPageData } from '../../../data/mockData';
import FAQItem from '../components/FAQItem';

function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-gray-600">
            ¿Tienes dudas? Estamos aquí para ayudarte
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {landingPageData.faqs.map((faq, index) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isLast={index === landingPageData.faqs.length - 1}
            />
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            ¿No encuentras tu respuesta?{' '}
            <a href="mailto:support@example.com" className="text-primary-600 font-medium hover:text-primary-700">
              Contacta a nuestro equipo de soporte
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
