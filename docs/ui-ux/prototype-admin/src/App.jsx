import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ClientManagement from './components/ClientManagement';
import RoleManagement from './components/RoleManagement';
import PermissionManagement from './components/PermissionManagement';
import SubscriptionManagement from './components/SubscriptionManagement';
import AuditLogs from './components/AuditLogs';
import CustomerAnalytics from './components/CustomerAnalytics';
import PromotionManagement from './components/PromotionManagement';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Billing from './components/Billing';
import Support from './components/Support';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'permissions':
        return <PermissionManagement />;
      case 'subscription':
        return <SubscriptionManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'analytics':
        return <CustomerAnalytics />;
      case 'promotions':
        return <PromotionManagement />;
      case 'settings':
        return <Settings />;
      case 'reports':
        return <Reports />;
      case 'notifications':
        return <Notifications />;
      case 'billing':
        return <Billing />;
      case 'support':
        return <Support />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={setActiveView}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          activeView={activeView}
          onNavigate={setActiveView}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-8">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
