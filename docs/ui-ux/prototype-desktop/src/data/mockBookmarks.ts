export type BookmarkCollection = "dev-resources" | "tools" | "databases" | "design";

export interface Bookmark {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  collection: BookmarkCollection;
  isFavorite: boolean;
  createdAt: string;
}

export const COLLECTION_LABELS: Record<BookmarkCollection, string> = {
  "dev-resources": "Dev Resources",
  tools: "Tools",
  databases: "Databases",
  design: "Design",
};

export const COLLECTION_COLORS: Record<BookmarkCollection, { border: string; badge: string }> = {
  "dev-resources": { border: "border-l-blue-500", badge: "bg-blue-500/20 text-blue-300" },
  tools: { border: "border-l-purple-500", badge: "bg-purple-500/20 text-purple-300" },
  databases: { border: "border-l-green-500", badge: "bg-green-500/20 text-green-300" },
  design: { border: "border-l-pink-500", badge: "bg-pink-500/20 text-pink-300" },
};

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: "bm-1",
    title: "React Documentation",
    description:
      "The official React documentation with guides, API reference, and interactive examples for building modern UIs.",
    url: "https://react.dev",
    tags: ["react", "frontend", "docs"],
    collection: "dev-resources",
    isFavorite: true,
    createdAt: "2026-02-20",
  },
  {
    id: "bm-2",
    title: "Tailwind CSS Docs",
    description:
      "Utility-first CSS framework documentation with examples, customization guides, and plugin references.",
    url: "https://tailwindcss.com/docs",
    tags: ["css", "tailwind", "styling"],
    collection: "dev-resources",
    isFavorite: false,
    createdAt: "2026-02-18",
  },
  {
    id: "bm-3",
    title: "Linear - Product Roadmap",
    description:
      "Project management tool for tracking issues, sprints, and product roadmaps with a streamlined interface.",
    url: "https://linear.app",
    tags: ["project-management", "agile"],
    collection: "tools",
    isFavorite: false,
    createdAt: "2026-02-15",
  },
  {
    id: "bm-4",
    title: "PostgreSQL Performance Tips",
    description:
      "Best practices for PostgreSQL query optimization, indexing strategies, and performance monitoring.",
    url: "https://wiki.postgresql.org/wiki/Performance_Optimization",
    tags: ["postgresql", "performance", "database"],
    collection: "databases",
    isFavorite: false,
    createdAt: "2026-02-12",
  },
  {
    id: "bm-5",
    title: "Figma Design System",
    description:
      "Comprehensive design system resources in Figma, including component libraries, tokens, and style guides.",
    url: "https://www.figma.com/community",
    tags: ["figma", "design-system", "ui"],
    collection: "design",
    isFavorite: false,
    createdAt: "2026-02-10",
  },
];
