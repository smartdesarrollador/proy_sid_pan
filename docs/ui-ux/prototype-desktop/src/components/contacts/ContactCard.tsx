import { Pencil, Trash2, Star, Mail, Phone } from "lucide-react";
import type { Contact } from "../../data/mockContacts";
import { GROUP_COLORS, GROUP_LABELS } from "../../data/mockContacts";

interface ContactCardProps {
  contact: Contact;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const colors = GROUP_COLORS[contact.group];
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`;

  return (
    <div className="group rounded-lg border border-gray-700 bg-[#1a1a2e] p-3 transition-colors hover:border-gray-600">
      {/* Top row: avatar + name + actions */}
      <div className="mb-2 flex items-start gap-2.5">
        {/* Initials avatar */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-medium text-gray-200">
              {contact.firstName} {contact.lastName}
            </h3>
            {contact.isFavorite && (
              <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {(contact.position || contact.company) && (
            <p className="truncate text-xs text-gray-400">
              {contact.position}
              {contact.position && contact.company && " · "}
              {contact.company}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(contact.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-900/50 hover:text-red-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="mb-2 space-y-1">
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-blue-300"
        >
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{contact.email}</span>
        </a>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Phone size={11} className="shrink-0" />
          <span>{contact.phone}</span>
        </div>
      </div>

      {/* Group badge */}
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors.badge}`}>
        {GROUP_LABELS[contact.group]}
      </span>
    </div>
  );
}
