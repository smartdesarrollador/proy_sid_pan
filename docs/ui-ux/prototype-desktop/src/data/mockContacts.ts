export type ContactGroup = "clients" | "partners" | "suppliers" | "personal";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  group: ContactGroup;
  isFavorite: boolean;
  notes: string;
  createdAt: string;
}

export const GROUP_LABELS: Record<ContactGroup, string> = {
  clients: "Clientes",
  partners: "Socios",
  suppliers: "Proveedores",
  personal: "Personal",
};

export const GROUP_COLORS: Record<ContactGroup, { bg: string; text: string; badge: string }> = {
  clients: { bg: "bg-blue-500/20", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-300" },
  partners: { bg: "bg-purple-500/20", text: "text-purple-300", badge: "bg-purple-500/20 text-purple-300" },
  suppliers: { bg: "bg-orange-500/20", text: "text-orange-300", badge: "bg-orange-500/20 text-orange-300" },
  personal: { bg: "bg-green-500/20", text: "text-green-300", badge: "bg-green-500/20 text-green-300" },
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "contact-1",
    firstName: "María",
    lastName: "González",
    email: "maria.gonzalez@techcorp.com",
    phone: "+34 612 345 678",
    company: "TechCorp Solutions",
    position: "CTO",
    group: "clients",
    isFavorite: true,
    notes: "Contacto principal para el proyecto de migración cloud.",
    createdAt: "2026-01-15",
  },
  {
    id: "contact-2",
    firstName: "Carlos",
    lastName: "Rodríguez",
    email: "carlos.r@innovatech.io",
    phone: "+34 698 765 432",
    company: "InnovaTech",
    position: "CEO",
    group: "partners",
    isFavorite: true,
    notes: "Socio estratégico para desarrollo de IA.",
    createdAt: "2026-01-20",
  },
  {
    id: "contact-3",
    firstName: "Ana",
    lastName: "Martínez",
    email: "ana.martinez@cloudserv.com",
    phone: "+34 655 123 456",
    company: "CloudServ",
    position: "Account Manager",
    group: "suppliers",
    isFavorite: false,
    notes: "Proveedora de servicios de infraestructura cloud.",
    createdAt: "2026-02-01",
  },
  {
    id: "contact-4",
    firstName: "Pedro",
    lastName: "López",
    email: "pedro.lopez@gmail.com",
    phone: "+34 677 890 123",
    company: "",
    position: "Desarrollador Freelance",
    group: "personal",
    isFavorite: false,
    notes: "Amigo y colega del bootcamp.",
    createdAt: "2026-02-10",
  },
  {
    id: "contact-5",
    firstName: "Laura",
    lastName: "Sánchez",
    email: "laura.s@dataflow.es",
    phone: "+34 644 567 890",
    company: "DataFlow Analytics",
    position: "Data Lead",
    group: "clients",
    isFavorite: false,
    notes: "Interesada en integración de dashboards.",
    createdAt: "2026-02-18",
  },
];
