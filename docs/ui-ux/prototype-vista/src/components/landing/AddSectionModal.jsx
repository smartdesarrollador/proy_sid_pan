import { X, Layout, User, Code, Mail, MessageSquare, TrendingUp } from 'lucide-react';

const sectionTypes = [
  {
    id: 'hero',
    name: 'Hero',
    icon: Layout,
    description: 'Encabezado principal con llamado a la acción',
  },
  {
    id: 'about',
    name: 'Acerca de',
    icon: User,
    description: 'Información sobre ti o tu negocio',
  },
  {
    id: 'services',
    name: 'Servicios',
    icon: Code,
    description: 'Grid de servicios o características',
  },
  {
    id: 'testimonials',
    name: 'Testimonios',
    icon: MessageSquare,
    description: 'Opiniones y reseñas de clientes',
  },
  {
    id: 'stats',
    name: 'Estadísticas',
    icon: TrendingUp,
    description: 'Números y logros destacados',
  },
  {
    id: 'contact',
    name: 'Contacto',
    icon: Mail,
    description: 'Formulario o información de contacto',
  },
];

export const AddSectionModal = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  const handleSelectType = (typeId) => {
    onAdd(typeId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Agregar Sección
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Selecciona el tipo de sección que deseas agregar
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {sectionTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className="card card-hover card-body text-left p-4 transition-all hover:border-primary-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
