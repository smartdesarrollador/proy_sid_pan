import { CreditCard, Globe, Briefcase, FileText, ChevronRight } from 'lucide-react';

export const PublicLanding = ({ onLogin }) => {
  const features = [
    {
      icon: CreditCard,
      title: 'Tarjeta Digital',
      description: 'Comparte tu información profesional con un diseño moderno y personalizable',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Globe,
      title: 'Landing Page',
      description: 'Crea tu presencia online con páginas web profesionales sin código',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: Briefcase,
      title: 'Portafolio',
      description: 'Muestra tus proyectos y logros de forma impactante',
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: FileText,
      title: 'CV Digital',
      description: 'Curriculum vitae profesional con múltiples plantillas',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Vista Digital
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Tu presencia profesional en un solo lugar. Gestiona todos tus servicios digitales desde una plataforma unificada.
          </p>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Iniciar Sesión
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-200"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            ¿Por qué Vista Digital?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rápido y Fácil</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crea tu presencia digital en minutos, sin conocimientos técnicos
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-purple-600">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalizable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Diseña a tu medida con múltiples plantillas y opciones
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green-600">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mide el impacto con estadísticas detalladas en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            © 2026 Vista Digital. Todos los derechos reservados.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <a href="#" className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Términos de Servicio
            </a>
            <a href="#" className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Soporte
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
