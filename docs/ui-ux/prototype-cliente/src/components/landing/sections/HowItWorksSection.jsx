import { landingPageData } from '../../../data/mockData';
import StepCard from '../components/StepCard';

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comienza en 4 sencillos pasos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configura tu organización y empieza a colaborar en minutos
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {landingPageData.howItWorks.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              isLast={index === landingPageData.howItWorks.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
