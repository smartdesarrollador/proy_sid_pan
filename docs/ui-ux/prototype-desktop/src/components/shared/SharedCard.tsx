import {
  FolderOpen,
  CheckSquare,
  Calendar,
  FileText,
  StickyNote,
  Link2,
  ExternalLink,
} from "lucide-react";
import type { SharedItem, ResourceType } from "../../data/mockShared";
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_COLORS,
} from "../../data/mockShared";

const RESOURCE_ICONS: Record<ResourceType, React.ComponentType<{ size?: number; className?: string }>> = {
  project: FolderOpen,
  task: CheckSquare,
  event: Calendar,
  document: FileText,
  note: StickyNote,
};

interface SharedCardProps {
  item: SharedItem;
  onOpen: (id: string) => void;
}

export default function SharedCard({ item, onOpen }: SharedCardProps) {
  const ResourceIcon = RESOURCE_ICONS[item.resourceType];

  return (
    <div className="group rounded-lg border border-gray-700 bg-[#1a1a2e] p-3 transition-colors hover:border-gray-600">
      {/* Resource icon + name + hover action */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`mt-0.5 shrink-0 rounded p-1 ${RESOURCE_TYPE_COLORS[item.resourceType]}`}>
            <ResourceIcon size={14} />
          </div>
          <h3 className="text-sm font-medium leading-snug text-gray-200 truncate">
            {item.resourceName}
          </h3>
        </div>
        <button
          onClick={() => onOpen(item.id)}
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 opacity-0 transition-opacity hover:bg-gray-700 hover:text-gray-200 group-hover:opacity-100"
        >
          <ExternalLink size={12} />
          Abrir
        </button>
      </div>

      {/* Badges: resource type + access level */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${RESOURCE_TYPE_COLORS[item.resourceType]}`}>
          {RESOURCE_TYPE_LABELS[item.resourceType]}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ACCESS_LEVEL_COLORS[item.accessLevel]}`}>
          {ACCESS_LEVEL_LABELS[item.accessLevel]}
        </span>
        {item.isInherited && (
          <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
            <Link2 size={10} />
            Heredado
          </span>
        )}
      </div>

      {/* Shared by */}
      <p className="mb-1.5 text-xs text-gray-500">
        Compartido por: <span className="text-gray-400">{item.sharedByName}</span>
      </p>

      {/* Date */}
      <p className="mb-1.5 text-[11px] text-gray-500">
        {new Date(item.createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {/* Expiration */}
      {item.expiresAt && (
        <p className="mb-1.5 text-[11px] text-orange-400">
          Expira: {new Date(item.expiresAt).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}

      {/* Message */}
      {item.message && (
        <div className="mt-2 border-l-2 border-blue-500/50 pl-2">
          <p className="text-xs leading-relaxed text-gray-400 line-clamp-2">
            {item.message}
          </p>
        </div>
      )}
    </div>
  );
}
