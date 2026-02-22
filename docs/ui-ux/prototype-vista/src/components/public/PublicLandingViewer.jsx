import { useState, useEffect } from 'react';
import { Home, Menu, X } from 'lucide-react';
import { getUserByUsername, getLandingPageByUser } from '../../data/mockData';
import { HeroSection } from '../landing/HeroSection';
import { AboutSection } from '../landing/AboutSection';
import { ServicesSection } from '../landing/ServicesSection';
import { TestimonialsSection } from '../landing/TestimonialsSection';
import { StatsSection } from '../landing/StatsSection';
import { ContactSection } from '../landing/ContactSection';

const SECTION_ANCHORS = {
  hero:         { id: 'inicio',      label: 'Inicio' },
  about:        { id: 'sobre-mi',    label: 'Acerca de' },
  services:     { id: 'servicios',   label: 'Servicios' },
  testimonials: { id: 'testimonios', label: 'Testimonios' },
  stats:        { id: 'logros',      label: 'Logros' },
  contact:      { id: 'contacto',    label: 'Contacto' },
};

const getNavBgClass = (template) => {
  switch (template) {
    case 'creative':  return 'bg-purple-700 text-white';
    case 'dark':      return 'bg-gray-900 text-gray-100 border-b border-gray-700';
    case 'minimal':   return 'bg-white text-gray-900 border-b border-gray-200';
    default:          return 'bg-blue-700 text-white';
  }
};

const getNavLinkClass = (template) => {
  switch (template) {
    case 'minimal': return 'hover:text-blue-600 text-gray-700';
    case 'dark':    return 'hover:text-gray-300 text-gray-300';
    default:        return 'hover:text-white/70 text-white/90';
  }
};

const PublicLandingNav = ({ sections, template, siteTitle }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = sections
    .filter(s => SECTION_ANCHORS[s.type])
    .map(s => ({
      href: `#${SECTION_ANCHORS[s.type].id}`,
      label: SECTION_ANCHORS[s.type].label,
    }));

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`sticky top-0 z-50 ${getNavBgClass(template)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / Site title */}
        <a
          href="#inicio"
          onClick={(e) => handleNavClick(e, '#inicio')}
          className="text-lg font-bold truncate max-w-[200px]"
        >
          {siteTitle}
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`text-sm font-medium transition-colors ${getNavLinkClass(template)}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Abrir menú"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={`md:hidden border-t ${template === 'minimal' ? 'border-gray-200 bg-white' : template === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-white/20 bg-blue-800'}`}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium py-1 ${getNavLinkClass(template)}`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const PublicLandingFooter = ({ username }) => (
  <footer className="bg-gray-50 border-t border-gray-200 py-8 text-center">
    <p className="text-sm text-gray-500">
      Powered by{' '}
      <a href="/" className="font-semibold text-blue-600 hover:underline">
        Vista Digital
      </a>
    </p>
  </footer>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Cargando landing page...</p>
    </div>
  </div>
);

const NotFoundPage = ({ message = 'Landing page no encontrada' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-3">{message}</p>
      <p className="text-sm text-gray-400 mb-8">
        Esta página no existe o no está publicada
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Home className="w-5 h-5" />
        Volver al inicio
      </a>
    </div>
  </div>
);

const renderSection = (section, template) => {
  const anchor = SECTION_ANCHORS[section.type];
  const anchorId = anchor?.id;

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

  return (
    <div key={section.id} id={anchorId}>
      {inner}
    </div>
  );
};

export const PublicLandingViewer = ({ username }) => {
  const [landingData, setLandingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('Landing page no encontrada');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 400));

      const user = getUserByUsername(username);
      if (!user) {
        setNotFoundMessage('Usuario no encontrado');
        setNotFound(true);
        setLoading(false);
        return;
      }

      const landing = getLandingPageByUser(user.id);
      if (!landing) {
        setNotFoundMessage('Este usuario no tiene una landing page');
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!landing.isPublished) {
        setNotFoundMessage('Esta landing page no está publicada');
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLandingData(landing);
      document.title = landing.meta?.title || `${username} - Vista Digital`;
      setLoading(false);
    };

    load();
  }, [username]);

  if (loading) return <LoadingState />;
  if (notFound) return <NotFoundPage message={notFoundMessage} />;

  const visibleSections = (landingData.sections || [])
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  const template = landingData.template || 'corporate';
  const siteTitle = landingData.meta?.title || username;

  return (
    <div className="min-h-screen bg-white">
      <PublicLandingNav
        sections={visibleSections}
        template={template}
        siteTitle={siteTitle}
      />

      <main>
        {visibleSections.map(section => renderSection(section, template))}
      </main>

      <PublicLandingFooter username={username} />
    </div>
  );
};
