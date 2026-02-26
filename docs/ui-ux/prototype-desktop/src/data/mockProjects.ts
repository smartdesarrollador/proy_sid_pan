export type ProjectStatus = "active" | "paused" | "archived";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  sections: number;
  items: number;
  members: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Activo",
  paused: "Pausado",
  archived: "Archivado",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-green-500/20 text-green-300",
  paused: "bg-yellow-500/20 text-yellow-300",
  archived: "bg-gray-500/20 text-gray-300",
};

export const PROJECT_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Sistema de Autenticación",
    description: "Implementación completa del sistema de login, registro y gestión de sesiones con JWT y OAuth2",
    status: "active",
    color: "blue",
    sections: 4,
    items: 18,
    members: 3,
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    createdAt: "2026-01-10",
  },
  {
    id: "proj-2",
    name: "Infraestructura Cloud",
    description: "Migración de servicios a AWS con Terraform, CI/CD pipelines y monitoreo",
    status: "active",
    color: "green",
    sections: 6,
    items: 32,
    members: 5,
    startDate: "2026-02-01",
    endDate: "2026-06-15",
    createdAt: "2026-01-28",
  },
  {
    id: "proj-3",
    name: "Rediseño UI/UX",
    description: "Actualización del design system y componentes con accesibilidad WCAG 2.1 AA",
    status: "paused",
    color: "purple",
    sections: 3,
    items: 12,
    members: 2,
    startDate: "2025-11-01",
    endDate: "2026-03-01",
    createdAt: "2025-10-20",
  },
  {
    id: "proj-4",
    name: "API v2 Migración",
    description: "Migración de endpoints REST a la nueva versión con breaking changes documentados",
    status: "archived",
    color: "orange",
    sections: 5,
    items: 24,
    members: 4,
    startDate: "2025-08-01",
    endDate: "2025-12-31",
    createdAt: "2025-07-15",
  },
];
