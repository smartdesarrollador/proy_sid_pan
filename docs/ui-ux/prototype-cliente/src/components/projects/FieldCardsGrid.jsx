import { Plus, Camera, FileText } from 'lucide-react';
import { FieldCard } from './FieldCard';
import { EmptyState } from '../shared/EmptyState';

export const FieldCardsGrid = ({
  fields,
  selectedItem,
  onAddItem,
  onEditField,
  onDeleteField,
  onToggleFavorite
}) => {
  const handleCopyField = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      // En producción, mostrar toast notification
      console.log('Valor copiado al portapapeles');
    });
  };

  const handleShowFieldInfo = (field) => {
    alert(`Info del campo:\n\nNombre: ${field.fieldName}\nTipo: ${field.fieldType}\nEncriptado: ${field.isEncrypted ? 'Sí' : 'No'}`);
  };

  const handleTags = (fieldId) => {
    alert('Gestionar tags - Implementado en Sprint 3');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Items</h2>
          {selectedItem && (
            <span className={`badge badge-${selectedItem.type}`}>
              {selectedItem.type}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => alert('Captura de pantalla - Funcionalidad de prototipo')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Captura
          </button>
          <button
            onClick={onAddItem}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Item
          </button>
        </div>
      </div>

      {/* Grid de field cards */}
      {!selectedItem ? (
        <EmptyState
          icon={FileText}
          title="Selecciona un item"
          description="Haz click en un item del árbol para ver sus campos"
        />
      ) : fields.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay campos"
          description="Este item no tiene campos definidos"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <FieldCard
              key={field.id}
              field={field}
              itemType={selectedItem.type}
              onEdit={onEditField}
              onDelete={onDeleteField}
              onToggleFavorite={onToggleFavorite}
              onCopy={handleCopyField}
              onShowInfo={handleShowFieldInfo}
              onTags={handleTags}
            />
          ))}
        </div>
      )}
    </div>
  );
};
