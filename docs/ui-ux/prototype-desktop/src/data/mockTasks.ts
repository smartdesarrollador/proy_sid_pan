export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  comments: number;
  subtasks: Subtask[];
  createdAt: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "En revisión",
  done: "Completada",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Diseñar sistema de autenticación",
    description: "Implementar flujo completo de login/registro con JWT",
    status: "in_progress",
    priority: "high",
    assignee: "Ana García",
    dueDate: "2026-03-01",
    comments: 5,
    subtasks: [
      { id: "st-1-1", title: "Diseñar esquema de BD", completed: true },
      { id: "st-1-2", title: "Implementar endpoints", completed: false },
      { id: "st-1-3", title: "Agregar validaciones", completed: false },
    ],
    createdAt: "2026-02-10",
  },
  {
    id: "task-2",
    title: "Optimizar consultas de dashboard",
    description: "Reducir tiempo de carga del dashboard principal",
    status: "todo",
    priority: "medium",
    assignee: "Carlos López",
    dueDate: "2026-03-05",
    comments: 2,
    subtasks: [
      { id: "st-2-1", title: "Identificar queries lentas", completed: false },
      { id: "st-2-2", title: "Agregar índices", completed: false },
    ],
    createdAt: "2026-02-15",
  },
  {
    id: "task-3",
    title: "Crear componente de notificaciones",
    description: "Sistema de notificaciones en tiempo real con WebSockets",
    status: "review",
    priority: "high",
    assignee: "María Rodríguez",
    dueDate: "2026-02-28",
    comments: 8,
    subtasks: [
      { id: "st-3-1", title: "Diseñar UI del componente", completed: true },
      { id: "st-3-2", title: "Conectar WebSocket", completed: true },
      { id: "st-3-3", title: "Tests unitarios", completed: false },
    ],
    createdAt: "2026-02-08",
  },
  {
    id: "task-4",
    title: "Migrar a TypeScript estricto",
    description: "Activar strict mode y corregir errores de tipos",
    status: "todo",
    priority: "low",
    assignee: "Pedro Sánchez",
    dueDate: "2026-03-15",
    comments: 1,
    subtasks: [
      { id: "st-4-1", title: "Configurar tsconfig", completed: true },
      { id: "st-4-2", title: "Corregir errores", completed: false },
    ],
    createdAt: "2026-02-20",
  },
  {
    id: "task-5",
    title: "Implementar rate limiting en API",
    description: "Proteger endpoints públicos contra abuso",
    status: "done",
    priority: "urgent",
    assignee: "Ana García",
    dueDate: "2026-02-20",
    comments: 12,
    subtasks: [
      { id: "st-5-1", title: "Configurar Redis", completed: true },
      { id: "st-5-2", title: "Middleware de rate limit", completed: true },
      { id: "st-5-3", title: "Tests de carga", completed: true },
    ],
    createdAt: "2026-02-05",
  },
  {
    id: "task-6",
    title: "Documentar API con OpenAPI",
    description: "Generar documentación automática de todos los endpoints",
    status: "in_progress",
    priority: "medium",
    assignee: "María Rodríguez",
    dueDate: "2026-03-10",
    comments: 3,
    subtasks: [
      { id: "st-6-1", title: "Configurar drf-spectacular", completed: true },
      { id: "st-6-2", title: "Documentar endpoints", completed: false },
    ],
    createdAt: "2026-02-18",
  },
];
