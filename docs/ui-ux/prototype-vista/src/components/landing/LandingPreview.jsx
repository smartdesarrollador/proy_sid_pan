import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { ContactSection } from './ContactSection';
import { TestimonialsSection } from './TestimonialsSection';
import { StatsSection } from './StatsSection';

const SECTION_ANCHORS = {
  hero:         'inicio',
  about:        'sobre-mi',
  services:     'servicios',
  testimonials: 'testimonios',
  stats:        'logros',
  contact:      'contacto',
};

export const LandingPreview = ({ landingData, template }) => {
  const { sections = [] } = landingData;

  // Get sorted and visible sections
  const getSortedSections = () => {
    return sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order);
  };

  // Render section based on type
  const renderSection = (section) => {
    const anchorId = SECTION_ANCHORS[section.type];
    const inner = (() => {
      switch (section.type) {
        case 'hero':
          return <HeroSection content={section.content} template={template} />;
        case 'about':
          return <AboutSection content={section.content} />;
        case 'services':
          return <ServicesSection content={section.content} />;
        case 'testimonials':
          return <TestimonialsSection content={section.content} />;
        case 'stats':
          return <StatsSection content={section.content} template={template} />;
        case 'contact':
          return <ContactSection content={section.content} />;
        default:
          return null;
      }
    })();

    if (!inner) return null;
    return <div key={section.id} id={anchorId}>{inner}</div>;
  };

  const visibleSections = getSortedSections();

  if (visibleSections.length === 0) {
    return (
      <div className="card card-body text-center py-12">
        <div className="empty-state">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay secciones visibles en tu landing page
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Ve a Editar para agregar o mostrar secciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {visibleSections.map(section => renderSection(section))}
    </div>
  );

};
