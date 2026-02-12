import { useTranslation } from 'react-i18next';
import { landingPageData } from '../../../data/mockData';
import TestimonialCard from '../components/TestimonialCard';

function TestimonialsSection() {
  const { t } = useTranslation('landing');

  // Map testimonial IDs to translation keys
  const getTestimonialTranslation = (testimonialId) => {
    const mapping = {
      'testimonial-1': 'testimonial1',
      'testimonial-2': 'testimonial2',
      'testimonial-3': 'testimonial3'
    };
    return mapping[testimonialId] || 'testimonial1';
  };

  return (
    <section id="testimonials" className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {landingPageData.testimonials.map((testimonial) => {
            const translationKey = getTestimonialTranslation(testimonial.id);
            const translatedTestimonial = {
              ...testimonial,
              quote: t(`testimonials.items.${translationKey}.quote`),
              author: t(`testimonials.items.${translationKey}.author`),
              role: t(`testimonials.items.${translationKey}.role`),
              company: t(`testimonials.items.${translationKey}.company`)
            };
            return <TestimonialCard key={testimonial.id} testimonial={translatedTestimonial} />;
          })}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
