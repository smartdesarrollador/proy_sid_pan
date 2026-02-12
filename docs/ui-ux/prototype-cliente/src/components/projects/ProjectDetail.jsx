import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Search, Users } from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { FieldCardsGrid } from './FieldCardsGrid';
import { SectionModal } from './SectionModal';
import { EmptyState } from '../shared/EmptyState';
import ShareButton from '../sharing/ShareButton';
import {
  projects,
  getSectionsByProject,
  getItemsBySection,
  getFieldsByItem,
  projectSections as allSections,
  projectItems as allItems
} from '../../data/mockData';

export const ProjectDetail = ({ projectId, onBack }) => {
  // Estado principal
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemFields, setSelectedItemFields] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

  // Cargar proyecto y secciones al montar
  useEffect(() => {
    const foundProject = projects.find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      const projectSections = getSectionsByProject(projectId);
      setSections(projectSections);

      // Expandir primera sección por default
      if (projectSections.length > 0) {
        const firstSectionId = projectSections[0].id;
        setExpandedSections(new Set([firstSectionId]));

        // Seleccionar primer item por default
        const firstSectionItems = getItemsBySection(firstSectionId);
        if (firstSectionItems.length > 0) {
          handleSelectItem(firstSectionItems[0]);
        }
      }
    }
  }, [projectId]);

  // Handler para seleccionar item
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const fields = getFieldsByItem(item.id);
    setSelectedItemFields(fields);
  };

  // Handler para toggle sección
  const handleToggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Handler para colapsar todas las secciones
  const handleCollapseAll = () => {
    setExpandedSections(new Set());
  };

  // Handler para agregar sección
  const handleAddSection = () => {
    setIsSectionModalOpen(true);
  };

  // Handler para guardar nueva sección
  const handleSaveSection = (sectionData) => {
    const newSection = {
      id: `section-${Date.now()}`,
      projectId: projectId,
      ...sectionData,
      order: sections.length + 1,
      itemsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Agregar a mock data (en producción sería API call)
    allSections.push(newSection);
    setSections([...sections, newSection]);
    setIsSectionModalOpen(false);
  };

  // Handler para agregar item (placeholder para Sprint 3)
  const handleAddItem = () => {
    alert('Agregar item - Implementado en Sprint 3');
  };

  // Handler para editar campo
  const handleEditField = (field) => {
    alert(`Editar campo: ${field.fieldName} - Implementado en Sprint 3`);
  };

  // Handler para eliminar campo
  const handleDeleteField = (fieldId) => {
    if (confirm('¿Eliminar este campo?')) {
      const updatedFields = selectedItemFields.filter(f => f.id !== fieldId);
      setSelectedItemFields(updatedFields);
    }
  };

  // Handler para toggle favorito
  const handleToggleFavorite = (fieldId) => {
    // En producción actualizaría el item
    console.log('Toggle favorite:', fieldId);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <EmptyState
          title="Proyecto no encontrado"
          description="El proyecto que buscas no existe o no tienes acceso a él."
          actionLabel="Volver a proyectos"
          onAction={onBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Volver a proyectos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: project.color }}
              >
                {project.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCollapseAll}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Colapsar Todo
            </button>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>

            <button
              onClick={() => alert('Gestionar miembros - Sprint 3')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Miembros ({project.membersCount})
            </button>

            <ShareButton
              resourceType="project"
              resourceId={project.id}
              resourceName={project.name}
              currentUserRole="owner"
              size="md"
              variant="secondary"
              currentPlan="professional"
            />
          </div>
        </div>
      </div>

      {/* Layout 2 columnas */}
      <div className="flex gap-6 p-6">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <ProjectTree
            project={project}
            sections={sections}
            expandedSections={expandedSections}
            selectedItem={selectedItem}
            onToggleSection={handleToggleSection}
            onSelectItem={handleSelectItem}
            onAddSection={handleAddSection}
          />
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          <FieldCardsGrid
            fields={selectedItemFields}
            selectedItem={selectedItem}
            onAddItem={handleAddItem}
            onEditField={handleEditField}
            onDeleteField={handleDeleteField}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>

      {/* Section Modal */}
      {isSectionModalOpen && (
        <SectionModal
          projectId={projectId}
          sectionsCount={sections.length}
          onSave={handleSaveSection}
          onClose={() => setIsSectionModalOpen(false)}
        />
      )}
    </div>
  );
};
