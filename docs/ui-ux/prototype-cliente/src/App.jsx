import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { TaskBoard } from './components/tasks/TaskBoard';
import { Calendar } from './components/calendar/Calendar';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProjectDetail } from './components/projects/ProjectDetail';

function AppContent() {
  const { isAuthenticated } = useAuth();
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
      case 'profile':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Perfil</h2>
            <p className="text-gray-600">Esta vista estará disponible próximamente</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h2>
            <p className="text-gray-600">Esta vista estará disponible próximamente</p>
          </div>
        );
      default:
        return <UserDashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
