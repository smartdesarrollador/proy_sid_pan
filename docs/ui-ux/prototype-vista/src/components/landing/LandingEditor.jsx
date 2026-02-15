import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, MoveUp, MoveDown } from 'lucide-react';
import { AddSectionModal } from './AddSectionModal';
import { EditSectionModal } from './EditSectionModal';

const getSectionTypeName = (type) => {
  const typeNames = {
    hero: 'Hero',
    about: 'Acerca de',
    services: 'Servicios',
    contact: 'Contacto',
  };
  return typeNames[type] || type;
};

const getDefaultContent = (type) => {
  switch (type) {
    case 'hero':
      return {
        title: 'Nuevo Hero',
        subtitle: 'Subtítulo del hero',
        ctaText: 'Acción',
        ctaLink: '#',
        alignment: 'center',
      };
    case 'about':
      return {
        title: 'Acerca de',
        text: 'Escribe aquí tu información.',
        layout: 'image-right',
      };
    case 'services':
      return {
        title: 'Servicios',
        items: [
          { icon: 'Code', title: 'Servicio 1', description: 'Descripción del servicio' },
        ],
      };
    case 'contact':
      return {
        title: 'Contacto',
        showForm: true,
        email: '',
        phone: '',
        address: '',
      };
    default:
      return {};
  }
};

export const LandingEditor = ({ landingData, onSave, onCancel }) => {
  const [sections, setSections] = useState([...landingData.sections]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const handleAddSection = (sectionType) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: sectionType,
      order: sections.length,
      visible: true,
      content: getDefaultContent(sectionType),
    };

    setSections(prev => [...prev, newSection]);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
  };

  const handleSaveSection = (updatedSection) => {
    setSections(prev =>
      prev.map(s => s.id === updatedSection.id ? updatedSection : s)
    );
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId) => {
    if (sections.length === 1) {
      alert('Debes tener al menos una sección');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar esta sección?')) {
      return;
    }

    setSections(prev => {
      const filtered = prev.filter(s => s.id !== sectionId);
      // Reorder remaining sections
      return filtered.map((s, index) => ({ ...s, order: index }));
    });
  };

  const handleToggleVisibility = (sectionId) => {
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      )
    );
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;

    setSections(prev => {
      const newSections = [...prev];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      // Update order
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleMoveDown = (index) => {
    if (index === sections.length - 1) return;

    setSections(prev => {
      const newSections = [...prev];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      // Update order
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleSaveChanges = () => {
    if (sections.length === 0) {
      alert('Debes tener al menos una sección');
      return;
    }

    // Validate that at least one section is visible
    const hasVisibleSections = sections.some(s => s.visible);
    if (!hasVisibleSections) {
      alert('Debes tener al menos una sección visible');
      return;
    }

    onSave({ sections });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Editar Secciones
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Sección
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-4 mb-6">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`card card-body p-4 ${!section.visible ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              {/* Section Info */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sections.length - 1}
                    className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {getSectionTypeName(section.type)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {section.content.title || 'Sin título'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleVisibility(section.id)}
                  className="btn-secondary text-sm flex items-center gap-1"
                  title={section.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {section.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEditSection(section)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="btn-secondary text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="card card-body text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay secciones en tu landing page
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary mx-auto"
            >
              Agregar Primera Sección
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button onClick={handleSaveChanges} className="btn-primary">
          Guardar Cambios
        </button>
      </div>

      {/* Modals */}
      <AddSectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSection}
      />

      {editingSection && (
        <EditSectionModal
          section={editingSection}
          onSave={handleSaveSection}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
};
