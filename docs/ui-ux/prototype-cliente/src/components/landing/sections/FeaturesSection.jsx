import { landingPageData } from '../../../data/mockData';
import FeatureCard from '../components/FeatureCard';

function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para gestionar tu organización
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Herramientas profesionales diseñadas para equipos que valoran la seguridad y la eficiencia
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {landingPageData.features.map((feature) => (
            <FeatureCard
              key={feature.id}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
