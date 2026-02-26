export type NoteCategory = "work" | "personal" | "ideas" | "archive";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<NoteCategory, string> = {
  work: "Trabajo",
  personal: "Personal",
  ideas: "Ideas",
  archive: "Archivo",
};

export const CATEGORY_COLORS: Record<NoteCategory, { border: string; badge: string }> = {
  work: { border: "border-l-blue-500", badge: "bg-blue-500/20 text-blue-300" },
  personal: { border: "border-l-green-500", badge: "bg-green-500/20 text-green-300" },
  ideas: { border: "border-l-yellow-500", badge: "bg-yellow-500/20 text-yellow-300" },
  archive: { border: "border-l-gray-500", badge: "bg-gray-500/20 text-gray-300" },
};

export const MOCK_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Ideas para refactoring del auth module",
    content:
      "Separar la lógica de autenticación en middlewares independientes. Considerar migrar de sessions a JWT para mejor escalabilidad. Revisar implementación de refresh tokens.",
    category: "work",
    isPinned: true,
    tags: ["backend", "security", "jwt"],
    createdAt: "2026-02-20",
    updatedAt: "2026-02-24",
  },
  {
    id: "note-2",
    title: "Idea: App de gestión de tiempo con IA",
    content:
      "Una app que use IA para analizar patrones de productividad y sugerir bloques de tiempo óptimos. Integrar con calendarios existentes. Modelo freemium con análisis avanzados de pago.",
    category: "ideas",
    isPinned: true,
    tags: ["idea", "ai", "productivity"],
    createdAt: "2026-02-18",
    updatedAt: "2026-02-22",
  },
  {
    id: "note-3",
    title: "Lista de compras semanal",
    content:
      "Frutas y verduras, leche, pan integral, pollo, arroz, pasta, aceite de oliva, café, huevos, queso.",
    category: "personal",
    isPinned: false,
    tags: ["personal", "shopping"],
    createdAt: "2026-02-22",
    updatedAt: "2026-02-23",
  },
  {
    id: "note-4",
    title: "Notas reunión Q1 Planning",
    content:
      "Objetivos principales: lanzar v2.0 del producto, migrar infraestructura a Kubernetes, contratar 2 devs senior. Budget aprobado para herramientas de monitoring.",
    category: "work",
    isPinned: false,
    tags: ["meeting", "planning", "q1"],
    createdAt: "2026-02-15",
    updatedAt: "2026-02-15",
  },
  {
    id: "note-5",
    title: "Recursos de aprendizaje - TypeScript avanzado",
    content:
      "Type challenges repo, Matt Pocock tutorials, Effect-TS library, Total TypeScript course. Practicar utility types y conditional types.",
    category: "archive",
    isPinned: false,
    tags: ["learning", "typescript", "resources"],
    createdAt: "2026-02-10",
    updatedAt: "2026-02-12",
  },
];
