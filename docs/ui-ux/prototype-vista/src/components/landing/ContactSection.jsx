import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const ContactSection = ({ content }) => {
  const { title, showForm, email, phone, address } = content;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Handle form submission (in real app, send to backend)
    alert('Formulario enviado (demo)');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900" id="contact">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-12 text-center">
          {title}
        </h2>

        {showForm ? (
          // Contact Form
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="label">
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="input resize-none"
                placeholder="Escribe tu mensaje..."
              />
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Enviar Mensaje
            </button>
          </form>
        ) : (
          // Contact Information
          <div className="grid md:grid-cols-3 gap-8">
            {email && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Email
                </h3>
                <a
                  href={`mailto:${email}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {email}
                </a>
              </div>
            )}

            {phone && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Teléfono
                </h3>
                <a
                  href={`tel:${phone}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {phone}
                </a>
              </div>
            )}

            {address && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Ubicación
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {address}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
