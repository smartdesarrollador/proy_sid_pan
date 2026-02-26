export type ResourceType = "project" | "task" | "event" | "document" | "note";
export type AccessLevel = "viewer" | "commenter" | "editor" | "admin";

export interface SharedItem {
  id: string;
  resourceType: ResourceType;
  resourceName: string;
  sharedByName: string;
  accessLevel: AccessLevel;
  isInherited: boolean;
  parentResourceName?: string;
  message?: string;
  expiresAt?: string;
  createdAt: string;
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  project: "Proyecto",
  task: "Tarea",
  event: "Evento",
  document: "Documento",
  note: "Nota",
};

export const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
  project: "bg-blue-500/20 text-blue-300",
  task: "bg-orange-500/20 text-orange-300",
  event: "bg-red-500/20 text-red-300",
  document: "bg-indigo-500/20 text-indigo-300",
  note: "bg-yellow-500/20 text-yellow-300",
};

export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  project: "FolderOpen",
  task: "CheckSquare",
  event: "Calendar",
  document: "FileText",
  note: "StickyNote",
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  viewer: "Visualizador",
  commenter: "Comentador",
  editor: "Editor",
  admin: "Administrador",
};

export const ACCESS_LEVEL_COLORS: Record<AccessLevel, string> = {
  viewer: "bg-gray-500/20 text-gray-300",
  commenter: "bg-blue-500/20 text-blue-300",
  editor: "bg-green-500/20 text-green-300",
  admin: "bg-purple-500/20 text-purple-300",
};

export const MOCK_SHARED: SharedItem[] = [
  {
    id: "shared-1",
    resourceType: "project",
    resourceName: "Sistema de Autenticación",
    sharedByName: "Sarah Johnson",
    accessLevel: "editor",
    isInherited: false,
    createdAt: "2026-02-10",
  },
  {
    id: "shared-2",
    resourceType: "task",
    resourceName: "Implementar autenticación JWT",
    sharedByName: "Sarah Johnson",
    accessLevel: "editor",
    isInherited: true,
    parentResourceName: "Sistema de Autenticación",
    createdAt: "2026-02-10",
  },
  {
    id: "shared-3",
    resourceType: "event",
    resourceName: "Sprint Planning",
    sharedByName: "Mike Chen",
    accessLevel: "viewer",
    isInherited: false,
    createdAt: "2026-02-12",
  },
  {
    id: "shared-4",
    resourceType: "project",
    resourceName: "Infraestructura Cloud",
    sharedByName: "Mike Chen",
    accessLevel: "admin",
    isInherited: false,
    message: "Necesito que revises la configuración de Terraform antes del deploy",
    createdAt: "2026-02-14",
  },
  {
    id: "shared-5",
    resourceType: "document",
    resourceName: "Guía de Deployment",
    sharedByName: "Emma Davis",
    accessLevel: "viewer",
    isInherited: false,
    expiresAt: "2026-03-15",
    createdAt: "2026-02-18",
  },
  {
    id: "shared-6",
    resourceType: "note",
    resourceName: "Notas de Arquitectura",
    sharedByName: "Sarah Johnson",
    accessLevel: "commenter",
    isInherited: false,
    createdAt: "2026-02-20",
  },
];
