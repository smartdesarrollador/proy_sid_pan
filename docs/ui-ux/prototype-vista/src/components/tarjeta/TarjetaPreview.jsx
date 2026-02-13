import {
  MessageCircle,
  Link2,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  MapPin,
  Share2,
} from 'lucide-react';
import { QRCodeSection } from './QRCodeSection';

const ContactItem = ({ icon: Icon, label, value, href, color }) => {
  const handleClick = () => {
    if (href) {
      window.open(href, '_blank');
    }
  };

  return (
    <div className="contact-item" onClick={handleClick}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {value}
        </div>
      </div>
    </div>
  );
};

export const TarjetaPreview = ({ cardData, onShare }) => {
  const { profile, contact, social } = cardData;

  // Generate initials if no avatar
  const initials = profile.initials || profile.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="digital-card-layout">
      {/* Left Panel - Profile */}
      <div className="digital-card-left">
        <div className="mb-6">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white">
              {initials}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">{profile.displayName}</h1>
        <p className="text-gray-300 mb-4">{profile.title}</p>
        {profile.location && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{profile.location}</span>
          </div>
        )}
      </div>

      {/* Center Panel - Contact Info */}
      <div className="digital-card-center lg:col-span-1">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Información de Contacto
        </h2>
        <div className="space-y-2">
          {contact.whatsapp && (
            <ContactItem
              icon={MessageCircle}
              label="WhatsApp"
              value={contact.whatsapp}
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
              color="bg-green-500"
            />
          )}
          {contact.website && (
            <ContactItem
              icon={Link2}
              label="Portafolio"
              value={contact.website}
              href={contact.website}
              color="bg-blue-500"
            />
          )}
          {contact.email && (
            <ContactItem
              icon={Mail}
              label="Email"
              value={contact.email}
              href={`mailto:${contact.email}`}
              color="bg-red-500"
            />
          )}
          {contact.phone && (
            <ContactItem
              icon={Phone}
              label="Teléfono"
              value={contact.phone}
              href={`tel:${contact.phone}`}
              color="bg-gray-600"
            />
          )}
          {social.linkedin && (
            <ContactItem
              icon={Linkedin}
              label="LinkedIn"
              value="Ver perfil"
              href={social.linkedin}
              color="bg-blue-600"
            />
          )}
          {social.twitter && (
            <ContactItem
              icon={Twitter}
              label="Twitter"
              value="Ver perfil"
              href={social.twitter}
              color="bg-sky-500"
            />
          )}
          {social.instagram && (
            <ContactItem
              icon={Instagram}
              label="Instagram"
              value="Ver perfil"
              href={social.instagram}
              color="bg-pink-600"
            />
          )}
          {social.github && (
            <ContactItem
              icon={Github}
              label="GitHub"
              value="Ver perfil"
              href={social.github}
              color="bg-gray-800"
            />
          )}
        </div>

        <button
          onClick={onShare}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Compartir Tarjeta
        </button>
      </div>

      {/* Right Panel - QR Code */}
      <div className="digital-card-right">
        <QRCodeSection cardData={cardData} />
      </div>

      {/* Bottom Section - About & Specialties */}
      {(profile.about || profile.specialties?.length > 0) && (
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          {profile.about && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                Acerca de mí
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {profile.about}
              </p>
            </div>
          )}
          {profile.specialties?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, index) => (
                  <span key={index} className="specialty-badge">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
