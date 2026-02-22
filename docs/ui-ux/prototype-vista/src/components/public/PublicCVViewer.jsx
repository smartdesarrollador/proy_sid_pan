import { useEffect } from 'react';
import { Home, Sun, Moon } from 'lucide-react';
import { getUserByUsername, getCVByUsername } from '../../data/mockData';
import { useTheme } from '../../contexts/ThemeContext';
import { CVPreview } from '../cv/CVDigital';

// ─── States ───────────────────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Cargando CV...</p>
    </div>
  </div>
);

const NotFoundPage = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">{message}</p>
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

const CVNav = ({ fullName }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <span className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
          {fullName} · CV
        </span>

        <div className="flex items-center gap-3">
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

// ─── Footer ───────────────────────────────────────────────────────────────────

const CVFooter = () => (
  <footer className="py-8 text-center border-t border-gray-200 dark:border-gray-700 mt-12">
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Powered by{' '}
      <a href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
        Vista Digital
      </a>
    </p>
  </footer>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PublicCVViewer = ({ username }) => {
  const user = getUserByUsername(username);

  if (!user) {
    return <NotFoundPage message="Usuario no encontrado" />;
  }

  const cv = getCVByUsername(username);

  if (!cv) {
    return <NotFoundPage message="Este usuario no tiene CV público" />;
  }

  if (!cv.isPublished) {
    return <NotFoundPage message="Este CV no está publicado" />;
  }

  const fullName = cv.personalInfo?.fullName || user.name;

  // Set document title
  useEffect(() => {
    document.title = `${fullName} - CV | Vista Digital`;
    return () => { document.title = 'Vista Digital'; };
  }, [fullName]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CVNav fullName={fullName} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <CVPreview cv={cv} template={cv.template} />
      </main>

      <CVFooter />
    </div>
  );
};
