import { useState, useEffect } from 'react';
import { TarjetaPreview } from '../tarjeta/TarjetaPreview';
import { getDigitalCardByUsername } from '../../data/mockData';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Home } from 'lucide-react';

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Cargando tarjeta...</p>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Tarjeta digital no encontrada
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
        Esta tarjeta no existe o no está publicada
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

export const PublicCardViewer = ({ username }) => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    // Simulate loading delay
    const loadCard = async () => {
      setLoading(true);

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      const card = getDigitalCardByUsername(username);

      if (!card) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!card.isPublished) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCardData(card);
      setLoading(false);

      // TODO: Track view count (increment card.stats.views)
      // In real app, this would call API: POST /api/cards/{username}/views
    };

    loadCard();
  }, [username]);

  if (loading) {
    return <LoadingState />;
  }

  if (notFound) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Vista Digital
            </span>
          </a>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </header>

      {/* Card Content */}
      <main className="container mx-auto px-4 py-8">
        <TarjetaPreview cardData={cardData} onShare={null} />
      </main>

      {/* Simple Footer */}
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm">
          Powered by <span className="font-semibold text-blue-600 dark:text-blue-400">Vista Digital</span>
        </p>
      </footer>
    </div>
  );
};
