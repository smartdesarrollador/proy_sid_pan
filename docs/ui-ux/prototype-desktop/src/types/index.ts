export type PanelId =
  | "home"
  | "files"
  | "chat"
  | "alerts"
  | "tasks"
  | "notes"
  | "contacts"
  | "bookmarks"
  | "projects"
  | "snippets"
  | "shared"
  | "reports"
  | "profile"
  | "settings";

export interface NavItem {
  id: PanelId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}
