import { useState, useEffect } from 'react';
import {
  FileText, Download, Mail, Phone, MapPin, Globe, Briefcase,
  GraduationCap, Code2, Lock, Link, Copy, Check, ExternalLink,
  Languages, Award, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { useAuth } from '../../contexts/AuthContext';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import { getCVByUser, createDefaultCV } from '../../data/mockData';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'classic',  label: 'Clásico',      description: 'Diseño tradicional y profesional',    cssClass: 'cv-layout-classic', minPlan: 1 },
  { id: 'modern',   label: 'Moderno',       description: 'Gradientes y estilo contemporáneo',   cssClass: 'cv-layout-modern',  minPlan: 2 },
  { id: 'minimal',  label: 'Minimalista',   description: 'Limpio y sin distracciones',          cssClass: 'cv-layout-minimal', minPlan: 3 },
];

const SKILL_LEVELS   = ['beginner', 'intermediate', 'advanced', 'expert'];
const LANG_LEVELS    = ['basic', 'intermediate', 'fluent', 'native'];

const LEVEL_LABELS = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
  expert:       'Experto',
  basic:        'Básico',
  fluent:       'Fluido',
  native:       'Nativo',
};

const LEVEL_COLORS = {
  expert:       'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  advanced:     'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  intermediate: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
  beginner:     'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  native:       'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  fluent:       'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  basic:        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Date formatter ───────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return month ? `${months[parseInt(month, 10) - 1]} ${year}` : year;
};

// ─── CVPreview ─────────────────────────────────────────────────────────────────

export const CVPreview = ({ cv, template }) => {
  const tpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
  const { personalInfo: p, summary, experience, education, skills, languages, certifications } = cv;

  return (
    <div className={tpl.cssClass}>
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-600">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">{p.fullName}</h2>
        {p.title && <p className="text-xl text-primary-600 dark:text-primary-400 mb-4">{p.title}</p>}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
          {p.email    && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{p.email}</span>}
          {p.phone    && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{p.phone}</span>}
          {p.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{p.location}</span>}
          {p.website  && <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600"><Globe className="w-4 h-4" />{p.website.replace(/^https?:\/\//, '')}</a>}
          {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary-600"><Link className="w-4 h-4" />LinkedIn</a>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6">
          <h3 className="cv-section-title">Perfil Profesional</h3>
          <p className="text-gray-700 dark:text-gray-300">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <div className="mb-6">
          <h3 className="cv-section-title flex items-center gap-2">
            <Briefcase className="w-5 h-5" />Experiencia
          </h3>
          {experience.map(exp => (
            <div key={exp.id} className="cv-experience-item">
              <div className="flex items-start justify-between mb-1 gap-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{exp.position}</p>
                  <p className="text-primary-600 dark:text-primary-400">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(exp.startDate)} – {exp.current ? 'Presente' : formatDate(exp.endDate)}
                </span>
              </div>
              {exp.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{exp.description}</p>}
              {exp.achievements?.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {exp.achievements.map((a, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{a}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <div className="mb-6">
          <h3 className="cv-section-title flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />Educación
          </h3>
          {education.map(edu => (
            <div key={edu.id} className="cv-experience-item">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{edu.degree}</p>
                  <p className="text-gray-600 dark:text-gray-400">{edu.institution}{edu.location ? ` · ${edu.location}` : ''}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(edu.startDate)}{edu.endDate ? ` – ${formatDate(edu.endDate)}` : ''}
                </span>
              </div>
              {edu.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills?.length > 0 && (
        <div className="mb-6">
          <h3 className="cv-section-title flex items-center gap-2">
            <Code2 className="w-5 h-5" />Habilidades
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.id} className="skill-pill flex items-center gap-1">
                {skill.name}
                {skill.level && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[skill.level]}`}>
                    {LEVEL_LABELS[skill.level]}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages + Certifications (side by side if both exist) */}
      <div className={`${(languages?.length > 0 && certifications?.length > 0) ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
        {languages?.length > 0 && (
          <div className="mb-6">
            <h3 className="cv-section-title flex items-center gap-2">
              <Languages className="w-5 h-5" />Idiomas
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map(lang => (
                <span key={lang.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{lang.name}</span>
                  {lang.level && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[lang.level]}`}>
                      {LEVEL_LABELS[lang.level]}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {certifications?.length > 0 && (
          <div className="mb-6">
            <h3 className="cv-section-title flex items-center gap-2">
              <Award className="w-5 h-5" />Certificaciones
            </h3>
            <div className="space-y-2">
              {certifications.map(cert => (
                <div key={cert.id} className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cert.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}
                      {cert.credentialId ? ` · ID: ${cert.credentialId}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Section Card (collapsible) ───────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
          {Icon && <Icon className="w-4 h-4" />}
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

// ─── Edit helpers ─────────────────────────────────────────────────────────────

const EMPTY_EXP = { company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '', achievements: [] };
const EMPTY_EDU = { institution: '', degree: '', location: '', startDate: '', endDate: '', description: '' };
const EMPTY_SKILL = { name: '', level: 'intermediate' };
const EMPTY_LANG  = { name: '', level: 'intermediate' };
const EMPTY_CERT  = { name: '', issuer: '', date: '', credentialId: '' };

// ─── CVEditForm ───────────────────────────────────────────────────────────────

const CVEditForm = ({ cv, onChange, onDone }) => {
  const [editingItem, setEditingItem] = useState({ section: null, id: null, data: null });

  const updatePersonalInfo = (field, value) =>
    onChange({ ...cv, personalInfo: { ...cv.personalInfo, [field]: value } });

  const updateSummary = (value) => onChange({ ...cv, summary: value });

  // Generic list helpers
  const startEdit = (section, item) =>
    setEditingItem({ section, id: item.id, data: { ...item } });

  const startAdd = (section, empty) =>
    setEditingItem({ section, id: 'new', data: { ...empty, id: uid() } });

  const cancelEdit = () => setEditingItem({ section: null, id: null, data: null });

  const saveItem = (section) => {
    const { data } = editingItem;
    onChange({
      ...cv,
      [section]: editingItem.id === 'new'
        ? [...cv[section], data]
        : cv[section].map(i => i.id === data.id ? data : i),
    });
    cancelEdit();
  };

  const deleteItem = (section, id) =>
    onChange({ ...cv, [section]: cv[section].filter(i => i.id !== id) });

  const isEditing = (section, id) =>
    editingItem.section === section && editingItem.id === id;

  const setData = (field, value) =>
    setEditingItem(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));

  const p = cv.personalInfo;

  return (
    <div className="space-y-4">
      {/* Perfil */}
      <SectionCard title="Perfil" icon={null}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['fullName',  'Nombre completo',    'text'],
            ['title',     'Título profesional', 'text'],
            ['email',     'Email',              'email'],
            ['phone',     'Teléfono',           'tel'],
            ['location',  'Ubicación',          'text'],
            ['website',   'Sitio web',          'url'],
            ['linkedin',  'LinkedIn URL',       'url'],
          ].map(([field, label, type]) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input className="input" type={type} value={p[field] || ''} onChange={e => updatePersonalInfo(field, e.target.value)} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Resumen */}
      <SectionCard title="Resumen Profesional" icon={null}>
        <textarea
          className="input"
          rows={4}
          value={cv.summary || ''}
          onChange={e => updateSummary(e.target.value)}
          placeholder="Escribe un resumen profesional..."
        />
      </SectionCard>

      {/* Experiencia */}
      <SectionCard title="Experiencia" icon={Briefcase}>
        <div className="space-y-3">
          {cv.experience.map(exp => (
            <div key={exp.id}>
              {isEditing('experience', exp.id) ? (
                <ExpForm data={editingItem.data} setData={setData} onSave={() => saveItem('experience')} onCancel={cancelEdit} />
              ) : (
                <ItemRow
                  primary={exp.position}
                  secondary={`${exp.company} · ${formatDate(exp.startDate)} – ${exp.current ? 'Presente' : formatDate(exp.endDate)}`}
                  onEdit={() => startEdit('experience', exp)}
                  onDelete={() => deleteItem('experience', exp.id)}
                />
              )}
            </div>
          ))}
          {isEditing('experience', 'new') && (
            <ExpForm data={editingItem.data} setData={setData} onSave={() => saveItem('experience')} onCancel={cancelEdit} />
          )}
          {editingItem.section !== 'experience' && (
            <button onClick={() => startAdd('experience', EMPTY_EXP)} className="btn-secondary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />Agregar experiencia
            </button>
          )}
        </div>
      </SectionCard>

      {/* Educación */}
      <SectionCard title="Educación" icon={GraduationCap}>
        <div className="space-y-3">
          {cv.education.map(edu => (
            <div key={edu.id}>
              {isEditing('education', edu.id) ? (
                <EduForm data={editingItem.data} setData={setData} onSave={() => saveItem('education')} onCancel={cancelEdit} />
              ) : (
                <ItemRow
                  primary={edu.degree}
                  secondary={`${edu.institution} · ${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`}
                  onEdit={() => startEdit('education', edu)}
                  onDelete={() => deleteItem('education', edu.id)}
                />
              )}
            </div>
          ))}
          {isEditing('education', 'new') && (
            <EduForm data={editingItem.data} setData={setData} onSave={() => saveItem('education')} onCancel={cancelEdit} />
          )}
          {editingItem.section !== 'education' && (
            <button onClick={() => startAdd('education', EMPTY_EDU)} className="btn-secondary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />Agregar educación
            </button>
          )}
        </div>
      </SectionCard>

      {/* Habilidades */}
      <SectionCard title="Habilidades" icon={Code2}>
        <div className="space-y-2">
          {cv.skills.map(skill => (
            <div key={skill.id}>
              {isEditing('skills', skill.id) ? (
                <SkillLangForm data={editingItem.data} setData={setData} levels={SKILL_LEVELS} onSave={() => saveItem('skills')} onCancel={cancelEdit} />
              ) : (
                <ItemRow
                  primary={skill.name}
                  secondary={LEVEL_LABELS[skill.level] || skill.level}
                  badge={skill.level}
                  onEdit={() => startEdit('skills', skill)}
                  onDelete={() => deleteItem('skills', skill.id)}
                />
              )}
            </div>
          ))}
          {isEditing('skills', 'new') && (
            <SkillLangForm data={editingItem.data} setData={setData} levels={SKILL_LEVELS} onSave={() => saveItem('skills')} onCancel={cancelEdit} />
          )}
          {editingItem.section !== 'skills' && (
            <button onClick={() => startAdd('skills', EMPTY_SKILL)} className="btn-secondary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />Agregar habilidad
            </button>
          )}
        </div>
      </SectionCard>

      {/* Idiomas */}
      <SectionCard title="Idiomas" icon={Languages}>
        <div className="space-y-2">
          {cv.languages.map(lang => (
            <div key={lang.id}>
              {isEditing('languages', lang.id) ? (
                <SkillLangForm data={editingItem.data} setData={setData} levels={LANG_LEVELS} onSave={() => saveItem('languages')} onCancel={cancelEdit} />
              ) : (
                <ItemRow
                  primary={lang.name}
                  secondary={LEVEL_LABELS[lang.level] || lang.level}
                  badge={lang.level}
                  onEdit={() => startEdit('languages', lang)}
                  onDelete={() => deleteItem('languages', lang.id)}
                />
              )}
            </div>
          ))}
          {isEditing('languages', 'new') && (
            <SkillLangForm data={editingItem.data} setData={setData} levels={LANG_LEVELS} onSave={() => saveItem('languages')} onCancel={cancelEdit} />
          )}
          {editingItem.section !== 'languages' && (
            <button onClick={() => startAdd('languages', EMPTY_LANG)} className="btn-secondary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />Agregar idioma
            </button>
          )}
        </div>
      </SectionCard>

      {/* Certificaciones */}
      <SectionCard title="Certificaciones" icon={Award}>
        <div className="space-y-2">
          {cv.certifications.map(cert => (
            <div key={cert.id}>
              {isEditing('certifications', cert.id) ? (
                <CertForm data={editingItem.data} setData={setData} onSave={() => saveItem('certifications')} onCancel={cancelEdit} />
              ) : (
                <ItemRow
                  primary={cert.name}
                  secondary={`${cert.issuer}${cert.date ? ` · ${formatDate(cert.date)}` : ''}`}
                  onEdit={() => startEdit('certifications', cert)}
                  onDelete={() => deleteItem('certifications', cert.id)}
                />
              )}
            </div>
          ))}
          {isEditing('certifications', 'new') && (
            <CertForm data={editingItem.data} setData={setData} onSave={() => saveItem('certifications')} onCancel={cancelEdit} />
          )}
          {editingItem.section !== 'certifications' && (
            <button onClick={() => startAdd('certifications', EMPTY_CERT)} className="btn-secondary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />Agregar certificación
            </button>
          )}
        </div>
      </SectionCard>

      <div className="flex gap-3 pt-2">
        <button onClick={onDone} className="btn-primary">Guardar y Ver</button>
        <button onClick={onDone} className="btn-secondary">Cancelar</button>
      </div>
    </div>
  );
};

// ─── ItemRow ──────────────────────────────────────────────────────────────────

const ItemRow = ({ primary, secondary, badge, onEdit, onDelete }) => (
  <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{primary}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        {secondary}
        {badge && (
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${LEVEL_COLORS[badge]}`}>
            {LEVEL_LABELS[badge]}
          </span>
        )}
      </p>
    </div>
    <div className="flex items-center gap-1 flex-shrink-0">
      <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"><Pencil className="w-3.5 h-3.5" /></button>
      <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  </div>
);

// ─── Inline forms ─────────────────────────────────────────────────────────────

const FormActions = ({ onSave, onCancel }) => (
  <div className="flex gap-2 mt-3">
    <button onClick={onSave} className="btn-primary text-sm py-1.5">Guardar</button>
    <button onClick={onCancel} className="btn-secondary text-sm py-1.5 flex items-center gap-1"><X className="w-3.5 h-3.5" />Cancelar</button>
  </div>
);

const ExpForm = ({ data, setData, onSave, onCancel }) => (
  <div className="p-3 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50 dark:bg-primary-900/20 space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><label className="label text-xs">Cargo</label><input className="input" value={data.position || ''} onChange={e => setData('position', e.target.value)} /></div>
      <div><label className="label text-xs">Empresa</label><input className="input" value={data.company || ''} onChange={e => setData('company', e.target.value)} /></div>
      <div><label className="label text-xs">Ubicación</label><input className="input" value={data.location || ''} onChange={e => setData('location', e.target.value)} /></div>
      <div><label className="label text-xs">Fecha inicio (AAAA-MM)</label><input className="input" placeholder="2022-01" value={data.startDate || ''} onChange={e => setData('startDate', e.target.value)} /></div>
      {!data.current && (
        <div><label className="label text-xs">Fecha fin (AAAA-MM)</label><input className="input" placeholder="2023-12" value={data.endDate || ''} onChange={e => setData('endDate', e.target.value)} /></div>
      )}
      <div className="flex items-center gap-2 pt-5">
        <input type="checkbox" id="current-check" checked={data.current || false} onChange={e => setData('current', e.target.checked)} className="w-4 h-4" />
        <label htmlFor="current-check" className="text-sm text-gray-700 dark:text-gray-300">Trabajo actual</label>
      </div>
    </div>
    <div>
      <label className="label text-xs">Descripción</label>
      <textarea className="input" rows={2} value={data.description || ''} onChange={e => setData('description', e.target.value)} />
    </div>
    <div>
      <label className="label text-xs">Logros (uno por línea)</label>
      <textarea className="input" rows={2} value={(data.achievements || []).join('\n')} onChange={e => setData('achievements', e.target.value.split('\n').filter(Boolean))} />
    </div>
    <FormActions onSave={onSave} onCancel={onCancel} />
  </div>
);

const EduForm = ({ data, setData, onSave, onCancel }) => (
  <div className="p-3 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50 dark:bg-primary-900/20 space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div><label className="label text-xs">Institución</label><input className="input" value={data.institution || ''} onChange={e => setData('institution', e.target.value)} /></div>
      <div><label className="label text-xs">Grado / Título</label><input className="input" value={data.degree || ''} onChange={e => setData('degree', e.target.value)} /></div>
      <div><label className="label text-xs">Ubicación</label><input className="input" value={data.location || ''} onChange={e => setData('location', e.target.value)} /></div>
      <div><label className="label text-xs">Fecha inicio (AAAA-MM)</label><input className="input" placeholder="2015-09" value={data.startDate || ''} onChange={e => setData('startDate', e.target.value)} /></div>
      <div><label className="label text-xs">Fecha fin (AAAA-MM)</label><input className="input" placeholder="2019-06" value={data.endDate || ''} onChange={e => setData('endDate', e.target.value)} /></div>
    </div>
    <div>
      <label className="label text-xs">Descripción</label>
      <textarea className="input" rows={2} value={data.description || ''} onChange={e => setData('description', e.target.value)} />
    </div>
    <FormActions onSave={onSave} onCancel={onCancel} />
  </div>
);

const SkillLangForm = ({ data, setData, levels, onSave, onCancel }) => (
  <div className="p-3 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50 dark:bg-primary-900/20">
    <div className="grid grid-cols-2 gap-3">
      <div><label className="label text-xs">Nombre</label><input className="input" value={data.name || ''} onChange={e => setData('name', e.target.value)} /></div>
      <div>
        <label className="label text-xs">Nivel</label>
        <select className="input" value={data.level || ''} onChange={e => setData('level', e.target.value)}>
          {levels.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
        </select>
      </div>
    </div>
    <FormActions onSave={onSave} onCancel={onCancel} />
  </div>
);

const CertForm = ({ data, setData, onSave, onCancel }) => (
  <div className="p-3 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50 dark:bg-primary-900/20 space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2"><label className="label text-xs">Nombre de la certificación</label><input className="input" value={data.name || ''} onChange={e => setData('name', e.target.value)} /></div>
      <div><label className="label text-xs">Emisor</label><input className="input" value={data.issuer || ''} onChange={e => setData('issuer', e.target.value)} /></div>
      <div><label className="label text-xs">Fecha (AAAA-MM)</label><input className="input" placeholder="2023-06" value={data.date || ''} onChange={e => setData('date', e.target.value)} /></div>
      <div className="md:col-span-2"><label className="label text-xs">ID de credencial</label><input className="input" value={data.credentialId || ''} onChange={e => setData('credentialId', e.target.value)} /></div>
    </div>
    <FormActions onSave={onSave} onCancel={onCancel} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CVDigital = ({ mode = 'preview', onModeChange }) => {
  const { currentUser } = useAuth();
  const [cv, setCv] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasFeature, getUpgradeMessage, canPerformAction } = useFeatureGate();

  useEffect(() => {
    if (!currentUser) return;
    const loaded = getCVByUser(currentUser.id) || createDefaultCV(currentUser.id);
    setCv(loaded);
    setIsPublished(loaded.isPublished ?? false);
  }, [currentUser]);

  // Handle export mode triggered from sidebar
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

  if (!cv) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const publicURL = currentUser ? `${window.location.origin}/cv/${currentUser.username}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Error al copiar la URL');
    }
  };

  const handleOpenInNewTab = () => window.open(publicURL, '_blank', 'noopener,noreferrer');

  const handlePublish = () => setIsPublished(p => !p);

  const handleExportPDF = () => {
    if (!hasFeature('cvPDFExport')) { setShowUpgrade(true); return; }
    window.print();
  };

  // Template selector: determine allowed count from feature gate
  const allowedTemplates = canPerformAction ? (() => {
    if (hasFeature('cvTemplates') === false) return 1;
    // cvTemplates feature value: 1, 2, 3
    const gate = getUpgradeMessage('cvTemplates');
    // Starter => 2, Pro => 3, Free => 1
    const plan = currentUser?.plan || 'free';
    if (plan === 'enterprise' || plan === 'professional') return 3;
    if (plan === 'starter') return 2;
    return 1;
  })() : 1;

  const handleSelectTemplate = (tplId, minPlan) => {
    const allowed = minPlan <= allowedTemplates;
    if (!allowed) { setShowUpgrade(true); return; }
    setCv(prev => ({ ...prev, template: tplId }));
    if (onModeChange) onModeChange('preview');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">CV Digital</h1>
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

      {/* Public URL section — shown in preview and edit modes */}
      {(mode === 'preview' || mode === 'edit') && (
        isPublished ? (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Link className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">URL Pública</p>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success">Publicado</span>
                    <button onClick={handlePublish} className="btn-secondary text-sm">Despublicar</button>
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
                    >
                      {copied ? <><Check className="w-4 h-4 text-green-600" /><span className="text-green-600">Copiado</span></> : <><Copy className="w-4 h-4" /><span>Copiar</span></>}
                    </button>
                    <button
                      onClick={handleOpenInNewTab}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Abrir</span>
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Comparte este enlace para que otros puedan ver tu CV sin necesidad de iniciar sesión
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
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">CV no publicado</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Publica tu CV para generar una URL pública compartible</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-warning">Borrador</span>
                    <button onClick={handlePublish} className="btn-secondary text-sm">Publicar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Preview mode */}
      {mode === 'preview' && <CVPreview cv={cv} template={cv.template} />}

      {/* Edit mode */}
      {mode === 'edit' && (
        <CVEditForm
          cv={cv}
          onChange={setCv}
          onDone={() => onModeChange && onModeChange('preview')}
        />
      )}

      {/* Templates mode */}
      {mode === 'templates' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Selecciona una Plantilla</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {TEMPLATES.map(tpl => {
              const locked = tpl.minPlan > allowedTemplates;
              const isSelected = cv.template === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id, tpl.minPlan)}
                  className={`card p-6 text-left transition-all ${isSelected ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'} ${locked ? 'opacity-60' : ''}`}
                >
                  <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 flex items-center justify-center relative">
                    <FileText className="w-10 h-10 text-gray-400" />
                    {locked && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{tpl.label}</span>
                    {isSelected && <span className="badge badge-primary">Activo</span>}
                    {locked && <span className="badge badge-secondary text-xs">{tpl.minPlan === 2 ? 'Starter+' : 'Pro+'}</span>}
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
