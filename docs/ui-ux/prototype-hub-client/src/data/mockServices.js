export const MOCK_SERVICES = [
  {
    id: 'workspace',
    name: 'Workspace',
    description: 'Tareas, notas, proyectos y mas — tu espacio de productividad',
    icon: 'Layout',
    url: 'http://localhost:3001',
    status: 'active', // active | suspended | locked | coming_soon
    minPlan: 'starter',
    lastAccessed: '2026-03-03T10:30:00Z',
    color: '#6366f1', // indigo
  },
  {
    id: 'vista',
    name: 'Vista Digital',
    description: 'Tarjeta digital, landing page y portafolio profesional',
    icon: 'Globe',
    url: 'http://localhost:3002',
    status: 'active',
    minPlan: 'starter',
    lastAccessed: '2026-03-01T15:00:00Z',
    color: '#0ea5e9', // sky
  },
  {
    id: 'desktop',
    name: 'Desktop App',
    description: 'Aplicacion nativa para Windows y macOS',
    icon: 'Monitor',
    url: '#',
    status: 'coming_soon',
    minPlan: 'professional',
    lastAccessed: null,
    color: '#8b5cf6', // violet
  },
  {
    id: 'analytics',
    name: 'Analytics Pro',
    description: 'Reportes avanzados, metricas y exportaciones',
    icon: 'BarChart3',
    url: '#',
    status: 'locked',
    minPlan: 'professional',
    lastAccessed: null,
    color: '#f59e0b', // amber
  },
  {
    id: 'forms',
    name: 'Formularios',
    description: 'Crea formularios personalizados y recopila respuestas',
    icon: 'FileText',
    url: '#',
    status: 'locked',
    minPlan: 'enterprise',
    lastAccessed: null,
    color: '#10b981', // emerald
  },
]

export const MOCK_USER = {
  name: 'Empresa XYZ',
  email: 'admin@empresa-xyz.com',
  plan: 'starter',
  planLabel: 'Starter',
  avatar: null,
  billingStatus: 'Al dia',
  nextBillingDate: '2026-04-01',
  openTickets: 2,
  memberSince: '2025-01-15',
}

export const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    title: 'No puedo acceder a Workspace',
    description: 'Al intentar abrir el servicio Workspace me aparece un error 403 de acceso denegado.',
    status: 'open',
    priority: 'alta',
    createdAt: '2026-03-02T09:00:00Z',
  },
  {
    id: 'TKT-002',
    title: 'Factura de febrero no descarga',
    description: 'El boton de descarga de factura de febrero no responde. Necesito el documento para contabilidad.',
    status: 'in_progress',
    priority: 'media',
    createdAt: '2026-03-01T14:30:00Z',
  },
  {
    id: 'TKT-003',
    title: 'Pregunta sobre upgrade de plan',
    description: 'Quiero saber que incluye el plan Professional y si puedo migrar mis datos.',
    status: 'resolved',
    priority: 'baja',
    createdAt: '2026-02-25T11:00:00Z',
  },
  {
    id: 'TKT-004',
    title: 'Error al guardar perfil',
    description: 'Cuando intento actualizar mi nombre en el perfil aparece un error generico.',
    status: 'resolved',
    priority: 'media',
    createdAt: '2026-02-20T16:00:00Z',
  },
  {
    id: 'TKT-005',
    title: 'Vista Digital no carga imagenes',
    description: 'Las imagenes del portafolio no se muestran correctamente en dispositivos moviles.',
    status: 'resolved',
    priority: 'alta',
    createdAt: '2026-02-15T10:00:00Z',
  },
]

export const MOCK_INVOICES = [
  {
    id: 'INV-2026-003',
    date: '2026-03-01',
    period: '2026-03-01 / 2026-03-31',
    amount: '$29.00 USD',
    status: 'paid',
    downloadUrl: '#',
  },
  {
    id: 'INV-2026-002',
    date: '2026-02-01',
    period: '2026-02-01 / 2026-02-28',
    amount: '$29.00 USD',
    status: 'paid',
    downloadUrl: '#',
  },
  {
    id: 'INV-2026-001',
    date: '2026-01-01',
    period: '2026-01-01 / 2026-01-31',
    amount: '$29.00 USD',
    status: 'paid',
    downloadUrl: '#',
  },
]

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mes',
    description: 'Para explorar la plataforma',
    features: [
      { label: 'Workspace (acceso limitado)', included: true },
      { label: 'Vista Digital', included: false },
      { label: '1 usuario', included: true },
      { label: 'Soporte por email', included: true },
      { label: 'Analytics Pro', included: false },
      { label: 'Desktop App', included: false },
    ],
    cta: 'Comenzar gratis',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    period: '/mes',
    description: 'Para profesionales y pequeños equipos',
    features: [
      { label: 'Workspace completo', included: true },
      { label: 'Vista Digital', included: true },
      { label: 'Hasta 5 usuarios', included: true },
      { label: 'Soporte prioritario', included: true },
      { label: 'Analytics Pro', included: false },
      { label: 'Desktop App', included: false },
    ],
    cta: 'Plan actual',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$79',
    period: '/mes',
    description: 'Para equipos que necesitan mas poder',
    features: [
      { label: 'Workspace completo', included: true },
      { label: 'Vista Digital', included: true },
      { label: 'Hasta 20 usuarios', included: true },
      { label: 'Soporte 24/7', included: true },
      { label: 'Analytics Pro', included: true },
      { label: 'Desktop App', included: true },
    ],
    cta: 'Actualizar plan',
    popular: true,
  },
]
