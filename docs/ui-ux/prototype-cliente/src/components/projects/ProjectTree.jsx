import { Folder, Tag, FileText, Plus, ChevronRight, Star } from 'lucide-react';
import { getItemsBySection } from '../../data/mockData';

export const ProjectTree = ({
  project,
  sections,
  expandedSections,
  selectedItem,
  onToggleSection,
  onSelectItem,
  onAddSection
}) => {
  return (
    <div className="card p-4 sticky top-24">
      {/* Project header */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-gray-700">
        <Folder className="w-5 h-5 text-primary-600" />
        <span className="font-semibold text-gray-900 dark:text-white">{project.name}</span>
      </div>

      {/* Sections tree */}
      <nav className="space-y-1">
        {sections.map(section => {
          const isExpanded = expandedSections.has(section.id);
          const items = getItemsBySection(section.id);

          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => onToggleSection(section.id)}
                className="section-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
                <Tag
                  className="w-4 h-4"
                  style={{ color: section.color }}
                />
                <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                  {section.name}
                </span>
                {!isExpanded && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                  </span>
                )}
              </button>

              {/* Items dentro de la sección */}
              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {items.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                      Sin items
                    </div>
                  ) : (
                    items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSelectItem(item)}
                        className={`section-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedItem?.id === item.id
                            ? 'section-item-active bg-primary-50 text-primary-700'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">
                          {item.title}
                        </span>
                        {item.isFavorite && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add section button */}
        <button
          onClick={onAddSection}
          className="section-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-primary-600 hover:bg-primary-50 mt-4"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Sección</span>
        </button>
      </nav>
    </div>
  );
};
