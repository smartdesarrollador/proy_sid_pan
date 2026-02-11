import { useState } from 'react';
import { Plus, Search, Download, Grid, List } from 'lucide-react';
import { ProjectList } from './ProjectList';
import { ProjectModal } from './ProjectModal';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { usePermissions } from '../../hooks/usePermissions';
import { projects as initialProjects } from '../../data/mockData';

export const ProjectsView = ({ onSelectProject }) => {
  const [projects, setProjects] = useState(initialProjects);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(null);

  const { hasFeature, canPerformAction, getUpgradeMessage } = useFeatureGate();
  const { canCreateProjects, canEditProjects, canDeleteProjects } = usePermissions();

  const handleCreateProject = () => {
    // Verificar límite de proyectos
    if (!canPerformAction('maxProjects', projects.length)) {
      const message = getUpgradeMessage('maxProjects');
      setShowUpgradePrompt(message);
      return;
    }

    if (!canCreateProjects()) {
      alert('No tienes permisos para crear proyectos');
      return;
    }

    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    if (!canEditProjects()) {
      alert('No tienes permisos para editar proyectos');
      return;
    }

    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = (projectId) => {
    if (!canDeleteProjects()) {
      alert('No tienes permisos para eliminar proyectos');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este proyecto? Se perderán todas sus secciones e items.')) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const handleSaveProject = (projectData) => {
    if (selectedProject) {
      // Editar
      setProjects(projects.map(p =>
        p.id === selectedProject.id
          ? { ...p, ...projectData, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      ));
    } else {
      // Crear nuevo
      const newProject = {
        id: `project-${Date.now()}`,
        ...projectData,
        owner: 'user-001', // Mock current user
        sectionsCount: 0,
        itemsCount: 0,
        membersCount: 1,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setProjects([...projects, newProject]);
    }
    setIsModalOpen(false);
  };

  const handleNavigateToProject = (projectId) => {
    // Navegar a la vista de detalle
    onSelectProject(projectId);
  };

  const handleSearch = () => {
    if (!hasFeature('projectSearch')) {
      const message = getUpgradeMessage('projectSearch');
      setShowUpgradePrompt(message);
    }
  };

  const handleExport = () => {
    if (!hasFeature('projectExport')) {
      const message = getUpgradeMessage('projectExport');
      setShowUpgradePrompt(message);
      return;
    }
    alert('Exportar proyectos - Funcionalidad de prototipo');
  };

  // Filtrar proyectos por búsqueda (solo si tiene la feature)
  const filteredProjects = hasFeature('projectSearch') && searchQuery
    ? projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-600 mt-1">
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
          </p>
        </div>

        <button
          onClick={handleCreateProject}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Proyecto
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={hasFeature('projectSearch') ? 'Buscar proyectos...' : 'Búsqueda disponible en Plan Professional'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearch}
            disabled={!hasFeature('projectSearch')}
            className="input pl-10 w-full disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 border rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={!hasFeature('projectExport')}
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Projects List */}
      <ProjectList
        projects={filteredProjects}
        viewMode={viewMode}
        onSelect={handleNavigateToProject}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />

      {/* Modal */}
      {isModalOpen && (
        <ProjectModal
          project={selectedProject}
          onSave={handleSaveProject}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <UpgradePrompt
          message={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(null)}
        />
      )}
    </div>
  );
};
