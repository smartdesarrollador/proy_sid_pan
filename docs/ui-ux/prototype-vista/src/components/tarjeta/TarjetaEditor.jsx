import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export const TarjetaEditor = ({ cardData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    profile: { ...cardData.profile },
    contact: { ...cardData.contact },
    social: { ...cardData.social },
  });

  const [newSpecialty, setNewSpecialty] = useState('');

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          specialties: [...(prev.profile.specialties || []), newSpecialty.trim()],
        },
      }));
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (index) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        specialties: prev.profile.specialties.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="card card-body space-y-8">
        {/* Profile Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre Completo</label>
              <input
                type="text"
                value={formData.profile.displayName}
                onChange={(e) => handleChange('profile', 'displayName', e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Título / Profesión</label>
              <input
                type="text"
                value={formData.profile.title}
                onChange={(e) => handleChange('profile', 'title', e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Ubicación</label>
              <input
                type="text"
                value={formData.profile.location}
                onChange={(e) => handleChange('profile', 'location', e.target.value)}
                className="input"
                placeholder="Ciudad, País"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Acerca de mí</label>
              <textarea
                value={formData.profile.about}
                onChange={(e) => handleChange('profile', 'about', e.target.value)}
                className="input"
                rows="4"
                placeholder="Descripción breve sobre ti..."
              />
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Especialidades
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
              className="input flex-1"
              placeholder="Agregar especialidad..."
            />
            <button
              type="button"
              onClick={handleAddSpecialty}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.profile.specialties?.map((specialty, index) => (
              <span
                key={index}
                className="specialty-badge flex items-center gap-2 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={() => handleRemoveSpecialty(index)}
              >
                {specialty}
                <X className="w-3 h-3" />
              </span>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">WhatsApp</label>
              <input
                type="tel"
                value={formData.contact.whatsapp}
                onChange={(e) => handleChange('contact', 'whatsapp', e.target.value)}
                className="input"
                placeholder="+56912345678"
              />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => handleChange('contact', 'phone', e.target.value)}
                className="input"
                placeholder="+56912345678"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) => handleChange('contact', 'email', e.target.value)}
                className="input"
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <label className="label">Sitio Web</label>
              <input
                type="url"
                value={formData.contact.website}
                onChange={(e) => handleChange('contact', 'website', e.target.value)}
                className="input"
                placeholder="https://ejemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Redes Sociales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">LinkedIn</label>
              <input
                type="url"
                value={formData.social.linkedin}
                onChange={(e) => handleChange('social', 'linkedin', e.target.value)}
                className="input"
                placeholder="https://linkedin.com/in/usuario"
              />
            </div>
            <div>
              <label className="label">Twitter</label>
              <input
                type="url"
                value={formData.social.twitter}
                onChange={(e) => handleChange('social', 'twitter', e.target.value)}
                className="input"
                placeholder="https://twitter.com/usuario"
              />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input
                type="url"
                value={formData.social.instagram}
                onChange={(e) => handleChange('social', 'instagram', e.target.value)}
                className="input"
                placeholder="https://instagram.com/usuario"
              />
            </div>
            <div>
              <label className="label">GitHub</label>
              <input
                type="url"
                value={formData.social.github}
                onChange={(e) => handleChange('social', 'github', e.target.value)}
                className="input"
                placeholder="https://github.com/usuario"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Guardar Cambios
          </button>
        </div>
      </div>
    </form>
  );
};
