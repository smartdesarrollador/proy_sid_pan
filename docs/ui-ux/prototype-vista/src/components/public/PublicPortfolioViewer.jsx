import { useState, useEffect } from 'react';
import {
  Home, Briefcase, MapPin, ExternalLink, Github,
  Linkedin, Twitter, Globe, Eye, Sun, Moon,
} from 'lucide-react';
import {
  getUserByUsername,
  getPortfolioByUsername,
  getDigitalCardByUser,
} from '../../data/mockData';
import { useTheme } from '../../contexts/ThemeContext';

const CARD_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-pink-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-indigo-400 to-purple-500',
  'from-teal-400 to-cyan-500',
];

// ─── Loading & 404 ────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Cargando portafolio...</p>
    </div>
  </div>
);

const NotFoundPage = ({ message = 'Portafolio no encontrado' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">{message}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
        Esta página no existe o no tiene proyectos publicados
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

// ─── Nav ──────────────────────────────────────────────────────────────────────
const PortfolioNav = ({ displayName }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <span className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
          {displayName} · Portafolio
        </span>

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="/"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Vista Digital
          </a>
        </div>
      </div>
    </nav>
  );
};

// ─── Profile Hero ─────────────────────────────────────────────────────────────
const ProfileHero = ({ cardData }) => {
  const { profile, social, contact, theme } = cardData;
  const primaryColor = theme?.primaryColor || '#3B82F6';

  const socialLinks = [
    { key: 'linkedin', url: social?.linkedin, icon: Linkedin, label: 'LinkedIn' },
    { key: 'github',   url: social?.github,   icon: Github,   label: 'GitHub' },
    { key: 'twitter',  url: social?.twitter,  icon: Twitter,  label: 'Twitter' },
    { key: 'website',  url: contact?.website, icon: Globe,    label: 'Sitio web' },
  ].filter(l => l.url);

  return (
    <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-md"
          style={{ backgroundColor: primaryColor }}
        >
          {profile?.initials || profile?.displayName?.slice(0, 2).toUpperCase() || '?'}
        </div>

        {/* Name & title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{profile?.displayName}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">{profile?.title}</p>

        {/* Location */}
        {profile?.location && (
          <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4" />
            {profile.location}
          </p>
        )}

        {/* About */}
        {profile?.about && (
          <p className="max-w-xl text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4">
            {profile.about}
          </p>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3">
            {socialLinks.map(({ key, url, icon: Icon, label }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                className="p-2 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FilterBar = ({ tags, activeTag, onTagChange }) => (
  <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 py-4 sticky top-16 z-40">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 flex-wrap">
      <button
        onClick={() => onTagChange('all')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeTag === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Todos
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onTagChange(tag)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTag === tag
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  </div>
);

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, index }) => {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <Briefcase className="w-14 h-14 text-white/60" />
        {project.isFeatured && (
          <span className="absolute top-3 left-3 text-xs bg-yellow-400 text-yellow-900 font-semibold px-2.5 py-1 rounded-full">
            ★ Destacado
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{project.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{project.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver proyecto
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 dark:bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            )}
          </div>
          {project.views > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Eye className="w-3.5 h-3.5" />
              {project.views.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const PortfolioFooter = () => (
  <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8 text-center">
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Powered by{' '}
      <a href="/" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
        Vista Digital
      </a>
    </p>
  </footer>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const PublicPortfolioViewer = ({ username }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('Portafolio no encontrado');
  const [activeTag, setActiveTag] = useState('all');

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

      const projects = getPortfolioByUsername(username);
      const published = (projects || []).filter(p => p.isPublished);
      if (!projects || published.length === 0) {
        setNotFoundMessage('Este usuario no tiene proyectos publicados');
        setNotFound(true);
        setLoading(false);
        return;
      }

      const card = getDigitalCardByUser(user.id);
      const displayName = card?.profile?.displayName || user.name;
      document.title = `${displayName} - Portafolio | Vista Digital`;

      setPortfolioData(published);
      setCardData(card);
      setLoading(false);
    };

    load();
  }, [username]);

  if (loading) return <LoadingState />;
  if (notFound) return <NotFoundPage message={notFoundMessage} />;

  const allTags = [...new Set(portfolioData.flatMap(p => p.tags))];
  const featuredProjects = portfolioData.filter(p => p.isFeatured);
  const filteredProjects = activeTag === 'all'
    ? portfolioData
    : portfolioData.filter(p => p.tags.includes(activeTag));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PortfolioNav displayName={cardData?.profile?.displayName || username} />

      {cardData && <ProfileHero cardData={cardData} />}

      <FilterBar tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Featured projects section */}
        {activeTag === 'all' && featuredProjects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              ★ Proyectos Destacados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* All / filtered projects */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {activeTag === 'all'
              ? `${filteredProjects.length} proyecto${filteredProjects.length !== 1 ? 's' : ''}`
              : `${filteredProjects.length} proyecto${filteredProjects.length !== 1 ? 's' : ''} · ${activeTag}`}
          </h2>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-lg">No hay proyectos con ese filtro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PortfolioFooter />
    </div>
  );
};
