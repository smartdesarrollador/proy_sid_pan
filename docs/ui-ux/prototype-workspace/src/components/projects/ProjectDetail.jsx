import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Search, Users, X } from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { FieldCardsGrid } from './FieldCardsGrid';
import { SectionModal } from './SectionModal';
import { ItemModal } from './ItemModal';
import { FieldEditModal } from './FieldEditModal';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalSectionId, setItemModalSectionId] = useState(null);
  const [isFieldEditModalOpen, setIsFieldEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);

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

  // Handler para agregar item
  const handleAddItem = (sectionId) => {
    setItemModalSectionId(sectionId);
    setIsItemModalOpen(true);
  };

  // Handler para guardar nuevo item
  const handleSaveItem = (itemData) => {
    const newItem = {
      id: `item-${Date.now()}`,
      ...itemData
    };
    allItems.push(newItem);
    // Si el item es de la sección actualmente seleccionada, actualizar la vista
    if (selectedItem && selectedItem.sectionId === itemData.sectionId) {
      // Refresh items for the current view
    }
    setIsItemModalOpen(false);
  };

  // Handler para editar campo
  const handleEditField = (field) => {
    setEditingField(field);
    setIsFieldEditModalOpen(true);
  };

  // Handler para guardar campo editado
  const handleSaveField = (updatedField) => {
    setSelectedItemFields(prev =>
      prev.map(f => f.id === updatedField.id ? updatedField : f)
    );
    setIsFieldEditModalOpen(false);
    setEditingField(null);
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

      {/* Search bar */}
      {isSearchOpen && (
        <div className="px-6 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar items..."
              className="input w-full pl-9 pr-9"
              autoFocus
            />
            <button
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Layout 2 columnas */}
      <div className="flex gap-6 p-6">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <ProjectTree
            project={project}
            sections={sections}
            expandedSections={expandedSections}
            selectedItem={selectedItem}
            searchQuery={searchQuery}
            onToggleSection={handleToggleSection}
            onSelectItem={handleSelectItem}
            onAddSection={handleAddSection}
            onAddItem={handleAddItem}
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

      {/* Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        sectionId={itemModalSectionId}
        onSave={handleSaveItem}
        onClose={() => setIsItemModalOpen(false)}
      />

      {/* Field Edit Modal */}
      <FieldEditModal
        isOpen={isFieldEditModalOpen}
        field={editingField}
        onSave={handleSaveField}
        onClose={() => { setIsFieldEditModalOpen(false); setEditingField(null); }}
      />
    </div>
  );
};
