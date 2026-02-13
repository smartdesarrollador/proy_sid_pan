import { useState } from 'react';
import { Link, Copy, Check, ExternalLink } from 'lucide-react';

export const PublicURLSection = ({ username, isPublished }) => {
  const [copied, setCopied] = useState(false);

  if (!isPublished) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5">
            ⚠️
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Tarjeta no publicada
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Publica tu tarjeta para generar una URL pública compartible
            </p>
          </div>
        </div>
      </div>
    );
  }

  const publicURL = `${window.location.origin}/tarjeta/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('Error al copiar la URL');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(publicURL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <Link className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            URL Pública
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white font-mono truncate">
              {publicURL}
            </code>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Copiar URL"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Abrir</span>
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Comparte este enlace para que otros puedan ver tu tarjeta digital sin necesidad de iniciar sesión
          </p>
        </div>
      </div>
    </div>
  );
};
