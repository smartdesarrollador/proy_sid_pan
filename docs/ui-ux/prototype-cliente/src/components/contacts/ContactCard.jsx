import { Mail, Phone, Building2, Star, Edit2, Trash2 } from 'lucide-react';

const groupColors = {
  clients: 'bg-blue-500',
  partners: 'bg-purple-500',
  vendors: 'bg-orange-500',
  personal: 'bg-green-500',
};

export const ContactCard = ({ contact, onEdit, onDelete }) => {
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`;
  const bgColor = groupColors[contact.group] || 'bg-gray-500';

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`${bgColor} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {contact.firstName} {contact.lastName}
            </h3>
            {contact.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
          </div>
          {contact.position && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{contact.position}</p>
          )}
          {contact.company && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.company}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(contact)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={() => onDelete(contact.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:underline">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`}>
          {contact.group}
        </span>
      </div>
    </div>
  );
};
