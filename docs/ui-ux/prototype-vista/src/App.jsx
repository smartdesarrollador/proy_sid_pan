import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/shared/Navbar';
import { Sidebar } from './components/shared/Sidebar';
import { ServiceDashboard } from './components/dashboard/ServiceDashboard';
import { TarjetaDigital } from './components/tarjeta/TarjetaDigital';
import { LandingPage } from './components/landing/LandingPage';
import { Portafolio } from './components/portafolio/Portafolio';
import { CVDigital } from './components/cv/CVDigital';
import { PublicLanding } from './components/auth/LandingPage';
import { Login } from './components/auth/Login';
import { PublicCardViewer } from './components/public/PublicCardViewer';
import { PublicLandingViewer } from './components/public/PublicLandingViewer';
import { PublicPortfolioViewer } from './components/public/PublicPortfolioViewer';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [appState, setAppState] = useState('landing'); // 'landing' | 'login' | 'authenticated'
  const [activeService, setActiveService] = useState('dashboard');
  const [activeMode, setActiveMode] = useState('preview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Update app state based on authentication
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setAppState('authenticated');
      } else {
        setAppState('landing');
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleNavigate = (service, mode = 'preview') => {
    setActiveService(service);
    setActiveMode(mode);
  };

  const renderService = () => {
    switch (activeService) {
      case 'dashboard':
        return <ServiceDashboard onSelectService={(s) => handleNavigate(s)} />;
      case 'tarjeta':
        return <TarjetaDigital mode={activeMode} onModeChange={setActiveMode} />;
      case 'landing':
        return <LandingPage mode={activeMode} onModeChange={setActiveMode} />;
      case 'portafolio':
        return <Portafolio mode={activeMode} onModeChange={setActiveMode} />;
      case 'cv':
        return <CVDigital mode={activeMode} onModeChange={setActiveMode} />;
      default:
        return <ServiceDashboard onSelectService={(s) => handleNavigate(s)} />;
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Public Landing Page
  if (appState === 'landing') {
    return <PublicLanding onLogin={() => setAppState('login')} />;
  }

  // Login Page
  if (appState === 'login') {
    return <Login onBack={() => setAppState('landing')} />;
  }

  // Authenticated State - Main Application
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        activeService={activeService}
        onNavigate={(s) => handleNavigate(s)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          activeService={activeService}
          activeMode={activeMode}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
        {/* Spacer for fixed sidebar on desktop */}
        <div
          className={`hidden md:block shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderService()}
        </main>
      </div>
    </div>
  );
}

function App() {
  const pathname = window.location.pathname;
  const isPublicCardRoute = pathname.startsWith('/tarjeta/');

  // Public card route - no login required, but still needs AuthProvider for useAuth hook
  if (isPublicCardRoute) {
    const username = pathname.split('/')[2]; // Extract username from /tarjeta/{username}

    if (!username) {
      // Invalid URL like /tarjeta/ (no username)
      return (
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                  URL inválida
                </p>
                <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Volver al inicio
                </a>
              </div>
            </div>
          </ThemeProvider>
        </AuthProvider>
      );
    }

    return (
      <AuthProvider>
        <ThemeProvider>
          <PublicCardViewer username={username} />
        </ThemeProvider>
      </AuthProvider>
    );
  }

  // Public landing page route - no login required
  const isPublicLandingRoute = pathname.startsWith('/landing/');
  if (isPublicLandingRoute) {
    const landingUsername = pathname.split('/')[2];
    if (!landingUsername) {
      return (
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">URL inválida</p>
                <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Volver al inicio
                </a>
              </div>
            </div>
          </ThemeProvider>
        </AuthProvider>
      );
    }
    return (
      <AuthProvider>
        <ThemeProvider>
          <PublicLandingViewer username={landingUsername} />
        </ThemeProvider>
      </AuthProvider>
    );
  }

  // Public portfolio route - no login required
  const isPublicPortfolioRoute = pathname.startsWith('/portafolio/');
  if (isPublicPortfolioRoute) {
    const portfolioUsername = pathname.split('/')[2];
    if (!portfolioUsername) {
      return (
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">URL inválida</p>
                <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Volver al inicio
                </a>
              </div>
            </div>
          </ThemeProvider>
        </AuthProvider>
      );
    }
    return (
      <AuthProvider>
        <ThemeProvider>
          <PublicPortfolioViewer username={portfolioUsername} />
        </ThemeProvider>
      </AuthProvider>
    );
  }

  // Normal authenticated app flow
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
