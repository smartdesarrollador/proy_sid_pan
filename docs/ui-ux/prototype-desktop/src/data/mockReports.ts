export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  color: string;
  change?: number;
}

export interface ChartItem {
  label: string;
  value: number;
}

export interface ChartData {
  title: string;
  colorClass: string;
  items: ChartItem[];
}

export const STAT_CARDS: StatItem[] = [
  { id: "active-tasks", label: "Tareas activas", value: 5, icon: "CheckSquare", color: "bg-blue-500", change: 12 },
  { id: "completed-tasks", label: "Tareas completadas", value: 1, icon: "CheckSquare", color: "bg-green-500", change: 8 },
  { id: "upcoming-events", label: "Próximos eventos", value: 7, icon: "Calendar", color: "bg-purple-500", change: 5 },
  { id: "active-projects", label: "Proyectos activos", value: 2, icon: "Folder", color: "bg-orange-500", change: 0 },
  { id: "team-members", label: "Miembros del equipo", value: 5, icon: "Users", color: "bg-pink-500" },
  { id: "notes", label: "Notas", value: 5, icon: "FileText", color: "bg-yellow-500" },
  { id: "audit-events", label: "Eventos de auditoría", value: 5, icon: "Activity", color: "bg-red-500" },
  { id: "storage", label: "Almacenamiento usado", value: "12.5 GB", icon: "TrendingUp", color: "bg-cyan-500" },
];

export const TASKS_BY_STATUS: ChartData = {
  title: "Tareas por estado",
  colorClass: "bg-blue-500",
  items: [
    { label: "En progreso", value: 2 },
    { label: "En revisión", value: 1 },
    { label: "Pendiente", value: 2 },
    { label: "Completado", value: 1 },
  ],
};

export const TASKS_BY_PRIORITY: ChartData = {
  title: "Tareas por prioridad",
  colorClass: "bg-orange-500",
  items: [
    { label: "Alta", value: 2 },
    { label: "Media", value: 3 },
    { label: "Baja", value: 1 },
  ],
};

export const AUDIT_ACTIONS: ChartData = {
  title: "Acciones de auditoría",
  colorClass: "bg-purple-500",
  items: [
    { label: "assign_role", value: 1 },
    { label: "create_role", value: 1 },
    { label: "update_user", value: 1 },
    { label: "upgrade_plan", value: 1 },
    { label: "login_failed", value: 1 },
  ],
};
