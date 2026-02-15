import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const iconOptions = [
  'Cloud', 'Code', 'Users', 'Palette', 'Layout', 'Sparkles',
  'Mail', 'Globe', 'Zap', 'Shield', 'Heart', 'Star',
  'Briefcase', 'Target', 'TrendingUp', 'Award',
];

export const EditSectionModal = ({ section, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    ...section.content,
  });

  if (!section) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setFormData(prev => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { icon: 'Code', title: '', description: '' },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate based on section type
    if (section.type === 'hero' && (!formData.title || !formData.subtitle)) {
      alert('El título y subtítulo son requeridos');
      return;
    }

    if (section.type === 'about' && (!formData.title || !formData.text)) {
      alert('El título y texto son requeridos');
      return;
    }

    if (section.type === 'services' && (!formData.title || !formData.items?.length)) {
      alert('El título y al menos un servicio son requeridos');
      return;
    }

    if (section.type === 'contact' && !formData.title) {
      alert('El título es requerido');
      return;
    }

    onSave({ ...section, content: formData });
    onClose();
  };

  const renderFormFields = () => {
    switch (section.type) {
      case 'hero':
        return (
          <>
            <div>
              <label htmlFor="title" className="label">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="input"
                placeholder="Tu título principal"
              />
            </div>

            <div>
              <label htmlFor="subtitle" className="label">
                Subtítulo *
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={formData.subtitle || ''}
                onChange={handleChange}
                required
                className="input"
                placeholder="Descripción breve"
              />
            </div>

            <div>
              <label htmlFor="ctaText" className="label">
                Texto del Botón
              </label>
              <input
                type="text"
                id="ctaText"
                name="ctaText"
                value={formData.ctaText || ''}
                onChange={handleChange}
                className="input"
                placeholder="Ej: Contactar"
              />
            </div>

            <div>
              <label htmlFor="ctaLink" className="label">
                Enlace del Botón
              </label>
              <input
                type="text"
                id="ctaLink"
                name="ctaLink"
                value={formData.ctaLink || ''}
                onChange={handleChange}
                className="input"
                placeholder="Ej: #contact o mailto:email@example.com"
              />
            </div>

            <div>
              <label htmlFor="alignment" className="label">
                Alineación
              </label>
              <select
                id="alignment"
                name="alignment"
                value={formData.alignment || 'center'}
                onChange={handleChange}
                className="input"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
          </>
        );

      case 'about':
        return (
          <>
            <div>
              <label htmlFor="title" className="label">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="input"
                placeholder="Acerca de"
              />
            </div>

            <div>
              <label htmlFor="text" className="label">
                Texto *
              </label>
              <textarea
                id="text"
                name="text"
                value={formData.text || ''}
                onChange={handleChange}
                required
                rows={6}
                className="input resize-none"
                placeholder="Escribe sobre ti o tu negocio..."
              />
            </div>

            <div>
              <label htmlFor="layout" className="label">
                Disposición de Imagen
              </label>
              <select
                id="layout"
                name="layout"
                value={formData.layout || 'image-right'}
                onChange={handleChange}
                className="input"
              >
                <option value="image-left">Imagen a la Izquierda</option>
                <option value="image-right">Imagen a la Derecha</option>
              </select>
            </div>
          </>
        );

      case 'services':
        return (
          <>
            <div>
              <label htmlFor="title" className="label">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="input"
                placeholder="Servicios"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Servicios *</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              <div className="space-y-4">
                {(formData.items || []).map((item, index) => (
                  <div key={index} className="card card-body p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Servicio {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="label text-sm">Icono</label>
                      <select
                        value={item.icon}
                        onChange={(e) => handleItemChange(index, 'icon', e.target.value)}
                        className="input text-sm"
                      >
                        {iconOptions.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label text-sm">Título</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                        className="input text-sm"
                        placeholder="Nombre del servicio"
                      />
                    </div>

                    <div>
                      <label className="label text-sm">Descripción</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        rows={2}
                        className="input text-sm resize-none"
                        placeholder="Descripción breve"
                      />
                    </div>
                  </div>
                ))}

                {(!formData.items || formData.items.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay servicios agregados. Haz clic en "Agregar" para crear uno.
                  </p>
                )}
              </div>
            </div>
          </>
        );

      case 'contact':
        return (
          <>
            <div>
              <label htmlFor="title" className="label">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="input"
                placeholder="Contacto"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showForm"
                  checked={formData.showForm || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar formulario de contacto
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                Si está desactivado, se mostrará información de contacto
              </p>
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="input"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="address" className="label">
                Ubicación
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="input"
                placeholder="Ciudad, País"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Editar Sección: {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {renderFormFields()}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
