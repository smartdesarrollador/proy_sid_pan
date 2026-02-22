import { useState } from 'react';
import { Briefcase, ExternalLink, Github, Plus, Trash2, Edit2 } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

const MOCK_PROJECTS = [
  {
    id: 1,
    title: 'Dashboard Analytics',
    description: 'Panel de control con métricas en tiempo real y gráficas interactivas para e-commerce.',
    image: null,
    tags: ['React', 'TypeScript', 'Recharts'],
    url: '#',
    github: '#',
    featured: true,
  },
  {
    id: 2,
    title: 'API REST Node.js',
    description: 'API robusta con autenticación JWT, rate limiting y documentación Swagger completa.',
    image: null,
    tags: ['Node.js', 'Express', 'PostgreSQL'],
    url: '#',
    github: '#',
    featured: false,
  },
  {
    id: 3,
    title: 'App Móvil React Native',
    description: 'Aplicación de gestión de tareas con notificaciones push y sincronización offline.',
    image: null,
    tags: ['React Native', 'Expo', 'Firebase'],
    url: '#',
    github: '#',
    featured: true,
  },
];

const ProjectCard = ({ project, onEdit, onDelete }) => (
  <div className="project-card group relative">
    {/* Image placeholder */}
    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
      <Briefcase className="w-16 h-16 text-primary-400 dark:text-primary-600" />
    </div>
    {project.featured && (
      <span className="featured-badge">Destacado</span>
    )}
    <div className="p-5">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{project.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>
      <div className="flex flex-wrap gap-1 mb-4">
        {project.tags.map(tag => (
          <span key={tag} className="tag-badge">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <a href={project.url} className="p-1.5 text-gray-500 hover:text-primary-600 transition-colors" title="Ver proyecto">
            <ExternalLink className="w-4 h-4" />
          </a>
          <a href={project.github} className="p-1.5 text-gray-500 hover:text-primary-600 transition-colors" title="Ver código">
            <Github className="w-4 h-4" />
          </a>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(project)} className="p-1.5 text-gray-500 hover:text-primary-600 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(project.id)} className="p-1.5 text-gray-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ProjectForm = ({ project, onSave, onCancel }) => {
  const [form, setForm] = useState(project || { title: '', description: '', tags: '', url: '', github: '', featured: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || Date.now(),
      tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      </h3>
      <div>
        <label className="label">Título</label>
        <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      <div>
        <label className="label">Tecnologías (separadas por coma)</label>
        <input className="input" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="React, TypeScript, Tailwind" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">URL del proyecto</label>
          <input className="input" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://" />
        </div>
        <div>
          <label className="label">GitHub</label>
          <input className="input" value={form.github} onChange={e => setForm(p => ({ ...p, github: e.target.value }))} placeholder="https://github.com/..." />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} />
        <span className="text-sm text-gray-700 dark:text-gray-300">Proyecto destacado</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary">Guardar</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  );
};

export const Portafolio = ({ mode = 'preview', onModeChange }) => {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [editingProject, setEditingProject] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  if (!hasFeature('portfolio')) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Portafolio Digital</h1>
        <div className="card card-body text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Portafolio Profesional</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Muestra tus proyectos con galerías de imágenes y categorías personalizadas.
          </p>
          <button onClick={() => setShowUpgrade(true)} className="btn-primary mx-auto">
            Actualizar Plan
          </button>
        </div>
        {showUpgrade && (
          <UpgradePrompt
            isOpen={showUpgrade}
            onClose={() => setShowUpgrade(false)}
            featureInfo={getUpgradeMessage('portfolio')}
          />
        )}
      </div>
    );
  }

  const handleSave = (project) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === project.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = project;
        return updated;
      }
      return [...prev, project];
    });
    setEditingProject(null);
    if (onModeChange) onModeChange('projects');
  };

  const handleDelete = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Portafolio Digital</h1>
        <p className="text-gray-600 dark:text-gray-400">Muestra tus mejores proyectos al mundo</p>
      </div>

      {/* Preview mode */}
      {mode === 'preview' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">{projects.length} proyectos</p>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <Briefcase className="empty-state-icon" />
              <h3 className="empty-state-title">Sin proyectos</h3>
              <p className="empty-state-description">Agrega tu primer proyecto para empezar.</p>
              <button onClick={() => { setEditingProject({}); if (onModeChange) onModeChange('edit'); }} className="btn-primary">
                <Plus className="w-4 h-4 inline mr-2" />Agregar Proyecto
              </button>
            </div>
          ) : (
            <div className="portfolio-grid">
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onEdit={(proj) => { setEditingProject(proj); if (onModeChange) onModeChange('edit'); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <ProjectForm
          project={editingProject}
          onSave={handleSave}
          onCancel={() => { setEditingProject(null); if (onModeChange) onModeChange('preview'); }}
        />
      )}

      {/* Projects list mode */}
      {mode === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mis Proyectos</h2>
            <button
              onClick={() => { setEditingProject({}); if (onModeChange) onModeChange('edit'); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />Nuevo Proyecto
            </button>
          </div>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="card card-body flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{p.title}</span>
                    {p.featured && <span className="badge badge-warning text-xs">Destacado</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.description}</p>
                  <div className="flex gap-1 mt-2">
                    {p.tags.slice(0, 3).map(t => <span key={t} className="tag-badge">{t}</span>)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setEditingProject(p); if (onModeChange) onModeChange('edit'); }}
                    className="btn-secondary btn-sm flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn-danger btn-sm flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
