import { useState, useEffect } from 'react';
import { FileText, Download, Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Code2, Lock } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

const MOCK_CV = {
  profile: {
    name: 'Ana García López',
    title: 'Desarrolladora Full Stack',
    email: 'ana@example.com',
    phone: '+34 612 345 678',
    location: 'Madrid, España',
    website: 'ana.dev',
    about: 'Desarrolladora apasionada con 5+ años de experiencia construyendo aplicaciones web escalables.',
  },
  experience: [
    { id: 1, company: 'Tech Solutions SL', role: 'Senior Developer', period: '2022 - Actualidad', description: 'Desarrollo de aplicaciones React + Node.js para clientes enterprise.' },
    { id: 2, company: 'StartupXYZ', role: 'Frontend Developer', period: '2020 - 2022', description: 'Implementación de interfaces con React y gestión de estado con Redux.' },
    { id: 3, company: 'Digital Agency', role: 'Junior Developer', period: '2019 - 2020', description: 'Desarrollo de sitios web con HTML, CSS y JavaScript vanilla.' },
  ],
  education: [
    { id: 1, institution: 'Universidad Politécnica', degree: 'Ingeniería Informática', period: '2015 - 2019' },
    { id: 2, institution: 'Coursera / Google', degree: 'Certificación Cloud Computing', period: '2021' },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'Tailwind CSS'],
};

const TEMPLATES = [
  { id: 'classic', label: 'Clásico', description: 'Diseño tradicional y profesional', cssClass: 'cv-layout-classic' },
  { id: 'modern', label: 'Moderno', description: 'Gradientes y estilo contemporáneo', cssClass: 'cv-layout-modern' },
  { id: 'minimal', label: 'Minimalista', description: 'Limpio y sin distracciones', cssClass: 'cv-layout-minimal' },
];

const CVPreview = ({ cv, template }) => {
  const tpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
  return (
    <div className={tpl.cssClass}>
      {/* Profile header */}
      <div className="mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-600">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">{cv.profile.name}</h2>
        <p className="text-xl text-primary-600 dark:text-primary-400 mb-4">{cv.profile.title}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{cv.profile.email}</span>
          <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{cv.profile.phone}</span>
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{cv.profile.location}</span>
          <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{cv.profile.website}</span>
        </div>
      </div>

      {/* About */}
      <div className="mb-6">
        <h3 className="cv-section-title">Perfil Profesional</h3>
        <p className="text-gray-700 dark:text-gray-300">{cv.profile.about}</p>
      </div>

      {/* Experience */}
      <div className="mb-6">
        <h3 className="cv-section-title flex items-center gap-2">
          <Briefcase className="w-5 h-5" />Experiencia
        </h3>
        {cv.experience.map(exp => (
          <div key={exp.id} className="cv-experience-item">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{exp.role}</p>
                <p className="text-primary-600 dark:text-primary-400">{exp.company}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{exp.period}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{exp.description}</p>
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="mb-6">
        <h3 className="cv-section-title flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />Educación
        </h3>
        {cv.education.map(edu => (
          <div key={edu.id} className="cv-experience-item">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{edu.degree}</p>
                <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{edu.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div>
        <h3 className="cv-section-title flex items-center gap-2">
          <Code2 className="w-5 h-5" />Habilidades
        </h3>
        <div className="flex flex-wrap gap-2">
          {cv.skills.map(skill => (
            <span key={skill} className="skill-pill">{skill}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CVDigital = ({ mode = 'preview', onModeChange }) => {
  const [cv, setCv] = useState(MOCK_CV);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  // When sidebar triggers 'export' mode, run the action and revert to preview
  useEffect(() => {
    if (mode === 'export') {
      if (!hasFeature('cvPDFExport')) {
        setShowUpgrade(true);
      } else {
        window.print();
      }
      if (onModeChange) onModeChange('preview');
    }
  }, [mode]);

  const handleExportPDF = () => {
    if (!hasFeature('cvPDFExport')) {
      setShowUpgrade(true);
      return;
    }
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">CV Digital</h1>
          <p className="text-gray-600 dark:text-gray-400">Tu currículum vitae profesional y descargable</p>
        </div>
        <button
          onClick={handleExportPDF}
          className={`btn flex items-center gap-2 ${hasFeature('cvPDFExport') ? 'btn-primary' : 'btn-secondary'}`}
          title={!hasFeature('cvPDFExport') ? 'Requiere plan Starter o superior' : 'Exportar como PDF'}
        >
          {!hasFeature('cvPDFExport') && <Lock className="w-4 h-4" />}
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>

      {/* Preview mode */}
      {mode === 'preview' && (
        <CVPreview cv={cv} template={selectedTemplate} />
      )}

      {/* Edit mode */}
      {mode === 'edit' && (
        <div className="space-y-6">
          {/* Profile section */}
          <div className="card card-body">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Perfil</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre completo</label>
                <input className="input" value={cv.profile.name} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, name: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Título profesional</label>
                <input className="input" value={cv.profile.title} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, title: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={cv.profile.email} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, email: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={cv.profile.phone} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Ubicación</label>
                <input className="input" value={cv.profile.location} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, location: e.target.value } }))} />
              </div>
              <div>
                <label className="label">Sitio web</label>
                <input className="input" value={cv.profile.website} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, website: e.target.value } }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Resumen profesional</label>
                <textarea className="input" rows={3} value={cv.profile.about} onChange={e => setCv(p => ({ ...p, profile: { ...p.profile, about: e.target.value } }))} />
              </div>
            </div>
          </div>

          {/* Skills section */}
          <div className="card card-body">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Habilidades</h2>
            <div>
              <label className="label">Tecnologías y habilidades (separadas por coma)</label>
              <input
                className="input"
                value={cv.skills.join(', ')}
                onChange={e => setCv(p => ({ ...p, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => onModeChange && onModeChange('preview')} className="btn-primary">
              Guardar y Ver
            </button>
            <button onClick={() => onModeChange && onModeChange('preview')} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Templates mode */}
      {mode === 'templates' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Selecciona una Plantilla</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {TEMPLATES.map(tpl => {
              const isLocked = !hasFeature('cv') || (tpl.id !== 'classic' && !hasFeature('cvPDFExport') && tpl.id === 'minimal');
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => { setSelectedTemplate(tpl.id); if (onModeChange) onModeChange('preview'); }}
                  className={`card p-6 text-left transition-all ${isSelected ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'}`}
                >
                  <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{tpl.label}</span>
                    {isSelected && <span className="badge badge-primary">Activo</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      {showUpgrade && (
        <UpgradePrompt
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          featureInfo={getUpgradeMessage('cvPDFExport')}
        />
      )}
    </div>
  );
};
