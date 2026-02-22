import { useState, useEffect } from 'react';
import {
  Briefcase, ExternalLink, Github, Plus, Trash2, Edit2,
  Link, Globe, Copy, Check, Eye,
} from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { useAuth } from '../../contexts/AuthContext';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import {
  getPortfolioByUser,
  getDigitalCardByUser,
} from '../../data/mockData';

const CARD_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-pink-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-indigo-400 to-purple-500',
  'from-teal-400 to-cyan-500',
];

// ─── Preview card used in the internal preview ───────────────────────────────
const PreviewProjectCard = ({ project, index }) => {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <Briefcase className="w-10 h-10 text-white/70" />
        {project.isFeatured && (
          <span className="absolute top-2 left-2 text-xs bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-full">
            ★ Destacado
          </span>
        )}
        {!project.isPublished && (
          <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
            Borrador
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 text-sm">{project.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{project.description}</p>
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-badge">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Project list row ─────────────────────────────────────────────────────────
const ProjectRow = ({ project, onEdit, onDelete }) => (
  <div className="card card-body flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-medium text-gray-900 dark:text-gray-100">{project.title}</span>
        {project.isFeatured && <span className="badge badge-warning text-xs">★ Destacado</span>}
        {project.isPublished
          ? <span className="badge badge-success text-xs">Publicado</span>
          : <span className="badge badge-secondary text-xs">Borrador</span>}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description}</p>
      <div className="flex gap-1 mt-2 flex-wrap">
        {project.tags.slice(0, 4).map(t => <span key={t} className="tag-badge">{t}</span>)}
      </div>
    </div>
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => onEdit(project)}
        className="btn-secondary btn-sm flex items-center gap-1"
      >
        <Edit2 className="w-3.5 h-3.5" />Editar
      </button>
      <button onClick={() => onDelete(project.id)} className="btn-danger btn-sm flex items-center gap-1">
        <Trash2 className="w-3.5 h-3.5" />Eliminar
      </button>
    </div>
  </div>
);

// ─── Project form ─────────────────────────────────────────────────────────────
const ProjectForm = ({ project, onSave, onCancel }) => {
  const isNew = !project?.id;
  const [form, setForm] = useState(project || {
    title: '',
    description: '',
    tags: '',
    url: '',
    github: '',
    year: new Date().getFullYear(),
    category: 'Web',
    isFeatured: false,
    isPublished: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || `proj-${Date.now()}`,
      tags: typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : form.tags,
    });
  };

  const tagsValue = Array.isArray(form.tags) ? form.tags.join(', ') : form.tags;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="card card-body space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {isNew ? 'Nuevo Proyecto' : 'Editar Proyecto'}
      </h3>

      <div>
        <label className="label">Título</label>
        <input
          className="input"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          required
          placeholder="Nombre del proyecto"
        />
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea
          className="input"
          rows={3}
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Describe el proyecto brevemente"
        />
      </div>

      <div>
        <label className="label">Tecnologías (separadas por coma)</label>
        <input
          className="input"
          value={tagsValue}
          onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
          placeholder="React, TypeScript, Tailwind"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">URL del proyecto</label>
          <input
            className="input"
            value={form.url || ''}
            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
            placeholder="https://"
          />
        </div>
        <div>
          <label className="label">GitHub</label>
          <input
            className="input"
            value={form.github || ''}
            onChange={e => setForm(p => ({ ...p, github: e.target.value }))}
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Año</label>
          <select
            className="input"
            value={form.year || currentYear}
            onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            className="input"
            value={form.category || 'Web'}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
          >
            {['Web', 'Mobile', 'Backend', 'Data', 'DevOps', 'Diseño', 'Otro'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.isFeatured}
            onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">★ Proyecto destacado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.isPublished}
            onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Publicado</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary">Guardar</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const Portafolio = ({ mode = 'preview', onModeChange }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [cardData, setCardData] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isPortfolioPublished, setIsPortfolioPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  useEffect(() => {
    if (!currentUser) return;
    const portfolioProjects = getPortfolioByUser(currentUser.id);
    setProjects(portfolioProjects);
    setIsPortfolioPublished(portfolioProjects.length > 0);

    const card = getDigitalCardByUser(currentUser.id);
    setCardData(card);
  }, [currentUser]);

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

  const publicURL = `${window.location.origin}/portafolio/${currentUser?.username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar la URL');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(publicURL, '_blank', 'noopener,noreferrer');
  };

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

  const displayName = cardData?.profile?.displayName || currentUser?.name || '';
  const displayTitle = cardData?.profile?.title || '';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Portafolio Digital</h1>
        <p className="text-gray-600 dark:text-gray-400">Muestra tus mejores proyectos al mundo</p>
      </div>

      {/* Public URL Section */}
      {isPortfolioPublished ? (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Link className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">URL Pública</p>
                <div className="flex items-center gap-2">
                  <span className="badge badge-success">Publicado</span>
                  <button
                    onClick={() => setIsPortfolioPublished(false)}
                    className="btn-secondary text-sm"
                  >
                    Despublicar
                  </button>
                </div>
              </div>
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
                    title="Abrir portafolio público"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Abrir</span>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Comparte este enlace para que otros puedan ver tu portafolio sin necesidad de iniciar sesión
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Portafolio no publicado
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Publica tu portafolio para generar una URL pública compartible
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-warning">Borrador</span>
                  <button
                    onClick={() => setIsPortfolioPublished(true)}
                    className="btn-secondary text-sm"
                  >
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview mode */}
      {mode === 'preview' && (
        <div>
          {/* Mini profile */}
          {cardData && (
            <div className="card card-body mb-6 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ backgroundColor: cardData.theme?.primaryColor || '#3B82F6' }}
              >
                {cardData.profile?.initials || displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{displayName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{displayTitle}</p>
              </div>
              <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {projects.filter(p => p.isPublished).length} publicados
              </div>
            </div>
          )}

          {/* Tag filter pills (decorative) */}
          {projects.length > 0 && (() => {
            const allTags = [...new Set(projects.flatMap(p => p.tags))];
            return (
              <div className="flex gap-2 flex-wrap mb-6">
                <span className="px-3 py-1 rounded-full text-sm bg-primary-600 text-white font-medium">
                  Todos
                </span>
                {allTags.slice(0, 6).map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            );
          })()}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{projects.length} proyectos</p>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <Briefcase className="empty-state-icon" />
              <h3 className="empty-state-title">Sin proyectos</h3>
              <p className="empty-state-description">Agrega tu primer proyecto para empezar.</p>
              <button
                onClick={() => { setEditingProject({}); if (onModeChange) onModeChange('edit'); }}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 inline mr-2" />Agregar Proyecto
              </button>
            </div>
          ) : (
            <div className="portfolio-grid">
              {projects.map((p, i) => (
                <PreviewProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>
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
          {projects.length === 0 ? (
            <div className="empty-state">
              <Briefcase className="empty-state-icon" />
              <h3 className="empty-state-title">Sin proyectos</h3>
              <p className="empty-state-description">Agrega tu primer proyecto para empezar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => (
                <ProjectRow
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
          onCancel={() => { setEditingProject(null); if (onModeChange) onModeChange(projects.length > 0 ? 'projects' : 'preview'); }}
        />
      )}
    </div>
  );
};
