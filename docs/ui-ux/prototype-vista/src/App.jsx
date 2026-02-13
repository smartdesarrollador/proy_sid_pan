import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/shared/Navbar';
import { ServiceDashboard } from './components/dashboard/ServiceDashboard';
import { TarjetaDigital } from './components/tarjeta/TarjetaDigital';
import { LandingPage } from './components/landing/LandingPage';
import { Portafolio } from './components/portafolio/Portafolio';
import { CVDigital } from './components/cv/CVDigital';
import { PublicLanding } from './components/auth/LandingPage';
import { Login } from './components/auth/Login';
import { PublicCardViewer } from './components/public/PublicCardViewer';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [appState, setAppState] = useState('landing'); // 'landing' | 'login' | 'authenticated'
  const [activeService, setActiveService] = useState('dashboard');

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

  const renderService = () => {
    switch (activeService) {
      case 'dashboard':
        return <ServiceDashboard onSelectService={setActiveService} />;
      case 'tarjeta':
        return <TarjetaDigital />;
      case 'landing':
        return <LandingPage />;
      case 'portafolio':
        return <Portafolio />;
      case 'cv':
        return <CVDigital />;
      default:
        return <ServiceDashboard onSelectService={setActiveService} />;
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
        onNavigate={setActiveService}
      />
      <main className="container mx-auto px-4 py-8">
        {renderService()}
      </main>
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
