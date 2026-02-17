import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import LandingPage from './components/landing/LandingPage';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { TaskBoard } from './components/tasks/TaskBoard';
import { Calendar } from './components/calendar/Calendar';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProjectDetail } from './components/projects/ProjectDetail';
import SharedWithMeView from './components/sharing/SharedWithMeView';
import { SettingsView } from './components/SettingsView';
import { NotesView } from './components/notes/NotesView';
import { ContactsView } from './components/contacts/ContactsView';
import { BookmarksView } from './components/bookmarks/BookmarksView';
import { EnvVarsView } from './components/env-vars/EnvVarsView';
import { SSHKeysView } from './components/ssh-keys/SSHKeysView';
import { SSLCertsView } from './components/ssl-certs/SSLCertsView';
import { SnippetsView } from './components/snippets/SnippetsView';
import { FormsView } from './components/forms/FormsView';
import { AuditLogView } from './components/audit-log/AuditLogView';
import { ReportsView } from './components/reports/ReportsView';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [appState, setAppState] = useState('landing'); // 'landing', 'login', 'authenticated'
  const [activeView, setActiveView] = useState('user-dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setActiveView('projects');
  };

  const renderView = () => {
    switch (activeView) {
      case 'user-dashboard':
        return <UserDashboard />;
      case 'tasks':
        return <TaskBoard />;
      case 'calendar':
        return <Calendar />;
      case 'projects':
        return <ProjectsView onSelectProject={handleSelectProject} />;
      case 'project-detail':
        return (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={handleBackToProjects}
          />
        );
      case 'notes':
        return <NotesView />;
      case 'contacts':
        return <ContactsView />;
      case 'bookmarks':
        return <BookmarksView />;
      case 'env-vars':
        return <EnvVarsView />;
      case 'ssh-keys':
        return <SSHKeysView />;
      case 'ssl-certs':
        return <SSLCertsView />;
      case 'snippets':
        return <SnippetsView />;
      case 'forms':
        return <FormsView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'reports':
        return <ReportsView />;
      case 'shared-with-me':
        return (
          <SharedWithMeView
            currentPlan="professional"
            onNavigateToResource={(item) => {
              if (item.resourceType === 'project') {
                handleSelectProject(item.resourceId);
              } else if (item.resourceType === 'task') {
                setActiveView('tasks');
              } else if (item.resourceType === 'event') {
                setActiveView('calendar');
              }
            }}
          />
        );
      case 'profile':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mi Perfil</h2>
            <p className="text-gray-600 dark:text-gray-400">Esta vista estará disponible próximamente</p>
          </div>
        );
      case 'settings':
        return <SettingsView />;
      default:
        return <UserDashboard />;
    }
  };

  // Landing page - shown by default
  if (appState === 'landing') {
    return <LandingPage onGetStarted={() => setAppState('login')} />;
  }

  // Login page - shown when user clicks "Get Started" or not authenticated
  if (appState === 'login' || !isAuthenticated) {
    return (
      <Login
        onBack={() => setAppState('landing')}
        onLoginSuccess={() => setAppState('authenticated')}
      />
    );
  }

  // Authenticated app - main application
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          activeView={activeView}
          onNavigate={setActiveView}
        />

        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className={activeView === 'project-detail' ? 'mt-16' : 'p-8 mt-16'}>
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
