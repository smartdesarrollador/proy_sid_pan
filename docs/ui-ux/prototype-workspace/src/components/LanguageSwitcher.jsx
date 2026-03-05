import { useLanguage } from '../i18n/LanguageContext';

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLanguage === 'es'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        aria-label="Cambiar a español"
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLanguage === 'en'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}

export default LanguageSwitcher;
