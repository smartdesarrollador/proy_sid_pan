// Mock Data para Prototipo RBAC + Suscripciones
// Basado en PRD y diagramas UML

export const currentTenant = {
  id: 'tenant-001',
  name: 'Acme Corporation',
  subdomain: 'acme',
  logo: null,
  primaryColor: '#3b82f6',
  subscription: {
    plan: 'professional',
    status: 'active',
    currentPeriodEnd: '2026-03-09',
    trialEndsAt: null,
  },
  usage: {
    users: { current: 23, limit: 50 },
    storage: { current: 12.5, limit: 50, unit: 'GB' },
    apiCalls: { current: 8234, limit: 100000 }
  }
};

export const currentUser = {
  id: 'user-001',
  email: 'admin@acme.com',
  firstName: 'John',
  lastName: 'Smith',
  role: 'OrgAdmin',
  avatar: null,
  mfaEnabled: true,
  permissions: ['users.*', 'roles.*', 'permissions.*', 'billing.*', 'settings.*']
};

export const users = [
  {
    id: 'user-001',
    email: 'admin@acme.com',
    firstName: 'John',
    lastName: 'Smith',
    roles: ['OrgAdmin'],
    status: 'active',
    lastLogin: '2026-02-09 14:30',
    mfaEnabled: true,
    createdAt: '2025-12-01'
  },
  {
    id: 'user-002',
    email: 'sarah.johnson@acme.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    roles: ['Manager', 'HR Access'],
    status: 'active',
    lastLogin: '2026-02-09 09:15',
    mfaEnabled: true,
    createdAt: '2025-12-03'
  },
  {
    id: 'user-003',
    email: 'mike.chen@acme.com',
    firstName: 'Mike',
    lastName: 'Chen',
    roles: ['Member', 'Engineering'],
    status: 'active',
    lastLogin: '2026-02-08 16:45',
    mfaEnabled: false,
    createdAt: '2026-01-10'
  },
  {
    id: 'user-004',
    email: 'emma.davis@acme.com',
    firstName: 'Emma',
    lastName: 'Davis',
    roles: ['Content Editor'],
    status: 'active',
    lastLogin: '2026-02-09 11:20',
    mfaEnabled: false,
    createdAt: '2026-01-15'
  },
  {
    id: 'user-005',
    email: 'david.wilson@acme.com',
    firstName: 'David',
    lastName: 'Wilson',
    roles: ['Guest'],
    status: 'pending',
    lastLogin: null,
    mfaEnabled: false,
    createdAt: '2026-02-08'
  }
];

export const roles = [
  {
    id: 'role-001',
    name: 'OrgAdmin',
    description: 'Administrador de la organización con acceso completo',
    isSystemRole: true,
    usersCount: 1,
    permissionsCount: 48,
    color: '#dc2626',
    parentRole: null,
    createdAt: '2025-12-01'
  },
  {
    id: 'role-002',
    name: 'Manager',
    description: 'Gestión de equipo y aprobaciones',
    isSystemRole: true,
    usersCount: 3,
    permissionsCount: 32,
    color: '#ea580c',
    parentRole: 'Member',
    createdAt: '2025-12-01'
  },
  {
    id: 'role-003',
    name: 'Member',
    description: 'Miembro estándar del equipo',
    isSystemRole: true,
    usersCount: 15,
    permissionsCount: 18,
    color: '#3b82f6',
    parentRole: null,
    createdAt: '2025-12-01'
  },
  {
    id: 'role-004',
    name: 'Guest',
    description: 'Acceso limitado de solo lectura',
    isSystemRole: true,
    usersCount: 4,
    permissionsCount: 5,
    color: '#6b7280',
    parentRole: null,
    createdAt: '2025-12-01'
  },
  {
    id: 'role-005',
    name: 'Content Editor',
    description: 'Crear y editar contenido, requiere aprobación para publicar',
    isSystemRole: false,
    usersCount: 8,
    permissionsCount: 12,
    color: '#8b5cf6',
    parentRole: 'Member',
    createdAt: '2026-01-20'
  },
  {
    id: 'role-006',
    name: 'HR Access',
    description: 'Acceso a información de recursos humanos',
    isSystemRole: false,
    usersCount: 2,
    permissionsCount: 8,
    color: '#10b981',
    parentRole: 'Member',
    createdAt: '2026-01-25'
  }
];

export const permissions = [
  // Users
  { id: 'perm-001', codename: 'users.create', name: 'Crear Usuarios', resource: 'users', action: 'create', category: 'Users' },
  { id: 'perm-002', codename: 'users.read', name: 'Ver Usuarios', resource: 'users', action: 'read', category: 'Users' },
  { id: 'perm-003', codename: 'users.update', name: 'Editar Usuarios', resource: 'users', action: 'update', category: 'Users' },
  { id: 'perm-004', codename: 'users.delete', name: 'Eliminar Usuarios', resource: 'users', action: 'delete', category: 'Users' },
  { id: 'perm-005', codename: 'users.invite', name: 'Invitar Usuarios', resource: 'users', action: 'invite', category: 'Users' },

  // Roles
  { id: 'perm-006', codename: 'roles.create', name: 'Crear Roles', resource: 'roles', action: 'create', category: 'Roles' },
  { id: 'perm-007', codename: 'roles.read', name: 'Ver Roles', resource: 'roles', action: 'read', category: 'Roles' },
  { id: 'perm-008', codename: 'roles.update', name: 'Editar Roles', resource: 'roles', action: 'update', category: 'Roles' },
  { id: 'perm-009', codename: 'roles.delete', name: 'Eliminar Roles', resource: 'roles', action: 'delete', category: 'Roles' },
  { id: 'perm-010', codename: 'roles.assign', name: 'Asignar Roles', resource: 'roles', action: 'assign', category: 'Roles' },

  // Content
  { id: 'perm-011', codename: 'content.create', name: 'Crear Contenido', resource: 'content', action: 'create', category: 'Content' },
  { id: 'perm-012', codename: 'content.read', name: 'Ver Contenido', resource: 'content', action: 'read', category: 'Content' },
  { id: 'perm-013', codename: 'content.edit_own', name: 'Editar Contenido Propio', resource: 'content', action: 'edit', category: 'Content', scope: 'own' },
  { id: 'perm-014', codename: 'content.edit_all', name: 'Editar Todo el Contenido', resource: 'content', action: 'edit', category: 'Content', scope: 'all' },
  { id: 'perm-015', codename: 'content.publish', name: 'Publicar Contenido', resource: 'content', action: 'publish', category: 'Content' },
  { id: 'perm-016', codename: 'content.delete', name: 'Eliminar Contenido', resource: 'content', action: 'delete', category: 'Content' },

  // Projects
  { id: 'perm-017', codename: 'projects.create', name: 'Crear Proyectos', resource: 'projects', action: 'create', category: 'Projects' },
  { id: 'perm-018', codename: 'projects.read', name: 'Ver Proyectos', resource: 'projects', action: 'read', category: 'Projects' },
  { id: 'perm-019', codename: 'projects.update', name: 'Editar Proyectos', resource: 'projects', action: 'update', category: 'Projects' },
  { id: 'perm-020', codename: 'projects.delete', name: 'Eliminar Proyectos', resource: 'projects', action: 'delete', category: 'Projects' },

  // Billing
  { id: 'perm-021', codename: 'billing.read', name: 'Ver Facturación', resource: 'billing', action: 'read', category: 'Billing' },
  { id: 'perm-022', codename: 'billing.manage', name: 'Gestionar Facturación', resource: 'billing', action: 'manage', category: 'Billing' },
  { id: 'perm-023', codename: 'billing.upgrade', name: 'Actualizar Plan', resource: 'billing', action: 'upgrade', category: 'Billing' },
  { id: 'perm-024', codename: 'billing.cancel', name: 'Cancelar Suscripción', resource: 'billing', action: 'cancel', category: 'Billing' },

  // Settings
  { id: 'perm-025', codename: 'settings.read', name: 'Ver Configuración', resource: 'settings', action: 'read', category: 'Settings' },
  { id: 'perm-026', codename: 'settings.update', name: 'Editar Configuración', resource: 'settings', action: 'update', category: 'Settings' },

  // Audit
  { id: 'perm-027', codename: 'audit.read', name: 'Ver Auditoría', resource: 'audit', action: 'read', category: 'Audit' },
  { id: 'perm-028', codename: 'audit.export', name: 'Exportar Auditoría', resource: 'audit', action: 'export', category: 'Audit' },

  // Dashboard
  { id: 'perm-029', codename: 'dashboard.read', name: 'Ver Dashboard', resource: 'dashboard', action: 'read', category: 'Dashboard' },

  // Tasks
  { id: 'perm-030', codename: 'tasks.create', name: 'Crear Tareas', resource: 'tasks', action: 'create', category: 'Tasks' },
  { id: 'perm-031', codename: 'tasks.read', name: 'Ver Tareas', resource: 'tasks', action: 'read', category: 'Tasks' },
  { id: 'perm-032', codename: 'tasks.update', name: 'Editar Tareas', resource: 'tasks', action: 'update', category: 'Tasks' },
  { id: 'perm-033', codename: 'tasks.delete', name: 'Eliminar Tareas', resource: 'tasks', action: 'delete', category: 'Tasks' },
  { id: 'perm-034', codename: 'tasks.assign', name: 'Asignar Tareas', resource: 'tasks', action: 'assign', category: 'Tasks' },

  // Calendar
  { id: 'perm-035', codename: 'calendar.create', name: 'Crear Eventos', resource: 'calendar', action: 'create', category: 'Calendar' },
  { id: 'perm-036', codename: 'calendar.read', name: 'Ver Calendario', resource: 'calendar', action: 'read', category: 'Calendar' },
  { id: 'perm-037', codename: 'calendar.update', name: 'Editar Eventos', resource: 'calendar', action: 'update', category: 'Calendar' },
  { id: 'perm-038', codename: 'calendar.delete', name: 'Eliminar Eventos', resource: 'calendar', action: 'delete', category: 'Calendar' },
  { id: 'perm-039', codename: 'calendar.share', name: 'Compartir Calendario', resource: 'calendar', action: 'share', category: 'Calendar' },

  // Customers
  { id: 'perm-040', codename: 'customers.read', name: 'Ver Clientes', resource: 'customers', action: 'read', category: 'Customers' },
  { id: 'perm-041', codename: 'customers.update', name: 'Editar Clientes', resource: 'customers', action: 'update', category: 'Customers' },
];

export const subscriptionPlans = [
  {
    id: 'plan-free',
    name: 'Free',
    displayName: 'Plan Gratuito',
    priceMonthly: 0,
    priceAnnual: 0,
    description: 'Perfecto para empezar y equipos pequeños',
    features: [
      { name: 'Hasta 5 usuarios', included: true },
      { name: '1 GB de almacenamiento', included: true },
      { name: '1,000 llamadas API/mes', included: true },
      { name: 'Roles predefinidos', included: true },
      { name: 'Roles personalizados', included: false },
      { name: 'MFA', included: false },
      { name: 'SSO/SAML', included: false },
      { name: 'Soporte prioritario', included: false },
      { name: 'Custom branding', included: false }
    ],
    limits: {
      users: 5,
      storage: 1,
      apiCalls: 1000
    },
    popular: false
  },
  {
    id: 'plan-starter',
    name: 'Starter',
    displayName: 'Plan Inicial',
    priceMonthly: 29,
    priceAnnual: 290,
    description: 'Para equipos en crecimiento',
    features: [
      { name: 'Hasta 10 usuarios', included: true },
      { name: '5 GB de almacenamiento', included: true },
      { name: '10,000 llamadas API/mes', included: true },
      { name: 'Roles predefinidos', included: true },
      { name: 'Roles personalizados', included: false },
      { name: 'MFA', included: true },
      { name: 'SSO/SAML', included: false },
      { name: 'Soporte por email', included: true },
      { name: 'Custom branding', included: false }
    ],
    limits: {
      users: 10,
      storage: 5,
      apiCalls: 10000
    },
    popular: false
  },
  {
    id: 'plan-professional',
    name: 'Professional',
    displayName: 'Plan Profesional',
    priceMonthly: 99,
    priceAnnual: 990,
    description: 'Para organizaciones establecidas',
    features: [
      { name: 'Hasta 50 usuarios', included: true },
      { name: '50 GB de almacenamiento', included: true },
      { name: '100,000 llamadas API/mes', included: true },
      { name: 'Roles predefinidos', included: true },
      { name: 'Roles personalizados ilimitados', included: true },
      { name: 'MFA obligatorio', included: true },
      { name: 'SSO/SAML', included: false },
      { name: 'Soporte prioritario', included: true },
      { name: 'Custom branding', included: true }
    ],
    limits: {
      users: 50,
      storage: 50,
      apiCalls: 100000
    },
    popular: true
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    displayName: 'Plan Empresarial',
    priceMonthly: null,
    priceAnnual: null,
    description: 'Para grandes organizaciones',
    features: [
      { name: 'Usuarios ilimitados', included: true },
      { name: 'Almacenamiento ilimitado', included: true },
      { name: 'Llamadas API ilimitadas', included: true },
      { name: 'Roles predefinidos', included: true },
      { name: 'Roles personalizados ilimitados', included: true },
      { name: 'MFA obligatorio', included: true },
      { name: 'SSO/SAML', included: true },
      { name: 'Soporte dedicado 24/7', included: true },
      { name: 'Custom branding + White label', included: true }
    ],
    limits: {
      users: Infinity,
      storage: Infinity,
      apiCalls: Infinity
    },
    popular: false
  }
];

// ===========================
// Customers / Tenants
// ===========================

export const customers = [
  {
    id: 'tenant-001',
    companyName: 'Acme Corporation',
    subdomain: 'acme',
    adminEmail: 'admin@acme.com',
    adminName: 'John Smith',
    subscription: {
      planId: 'plan-professional',
      planName: 'Professional',
      status: 'active',
      currentPeriodStart: '2026-01-09',
      currentPeriodEnd: '2026-03-09',
      trialEndsAt: null,
      cancelledAt: null,
      mrr: 99
    },
    usage: {
      users: { current: 23, limit: 50 },
      storage: { current: 12.5, limit: 50, unit: 'GB' },
      apiCalls: { current: 8234, limit: 100000 }
    },
    createdAt: '2025-12-01',
    status: 'active',
    logo: null,
    primaryColor: '#3b82f6'
  },
  {
    id: 'tenant-002',
    companyName: 'TechStart Solutions',
    subdomain: 'techstart',
    adminEmail: 'carlos@techstart.com',
    adminName: 'Carlos Méndez',
    subscription: {
      planId: 'plan-starter',
      planName: 'Starter',
      status: 'trial',
      currentPeriodStart: '2026-02-05',
      currentPeriodEnd: '2026-02-19',
      trialEndsAt: '2026-02-19',
      cancelledAt: null,
      mrr: 0
    },
    usage: {
      users: { current: 5, limit: 10 },
      storage: { current: 2.1, limit: 5, unit: 'GB' },
      apiCalls: { current: 1450, limit: 10000 }
    },
    createdAt: '2026-02-05',
    status: 'active',
    logo: null,
    primaryColor: '#10b981'
  },
  {
    id: 'tenant-003',
    companyName: 'Global Logistics Inc',
    subdomain: 'globallog',
    adminEmail: 'roberto@globallog.com',
    adminName: 'Roberto Silva',
    subscription: {
      planId: 'plan-enterprise',
      planName: 'Enterprise',
      status: 'active',
      currentPeriodStart: '2025-11-15',
      currentPeriodEnd: '2026-11-15',
      trialEndsAt: null,
      cancelledAt: null,
      mrr: 499
    },
    usage: {
      users: { current: 87, limit: null },
      storage: { current: 234.7, limit: null, unit: 'GB' },
      apiCalls: { current: 45230, limit: null }
    },
    createdAt: '2025-11-15',
    status: 'active',
    logo: null,
    primaryColor: '#8b5cf6'
  },
  {
    id: 'tenant-004',
    companyName: 'Retail Solutions SA',
    subdomain: 'retailsol',
    adminEmail: 'ana@retailsol.com',
    adminName: 'Ana Martínez',
    subscription: {
      planId: 'plan-free',
      planName: 'Free',
      status: 'active',
      currentPeriodStart: '2026-01-20',
      currentPeriodEnd: null,
      trialEndsAt: null,
      cancelledAt: null,
      mrr: 0
    },
    usage: {
      users: { current: 3, limit: 5 },
      storage: { current: 0.8, limit: 1, unit: 'GB' },
      apiCalls: { current: 450, limit: 1000 }
    },
    createdAt: '2026-01-20',
    status: 'active',
    logo: null,
    primaryColor: '#f59e0b'
  },
  {
    id: 'tenant-005',
    companyName: 'Design Studio Pro',
    subdomain: 'designpro',
    adminEmail: 'laura@designpro.com',
    adminName: 'Laura Fernández',
    subscription: {
      planId: 'plan-professional',
      planName: 'Professional',
      status: 'past_due',
      currentPeriodStart: '2026-01-01',
      currentPeriodEnd: '2026-03-01',
      trialEndsAt: null,
      cancelledAt: null,
      mrr: 99
    },
    usage: {
      users: { current: 15, limit: 50 },
      storage: { current: 18.3, limit: 50, unit: 'GB' },
      apiCalls: { current: 12450, limit: 100000 }
    },
    createdAt: '2025-10-15',
    status: 'active',
    logo: null,
    primaryColor: '#ec4899'
  }
];

export const auditLogs = [
  {
    id: 'audit-001',
    timestamp: '2026-02-09 14:30:15',
    actor: 'John Smith',
    action: 'assign_role',
    resource: 'User: Emma Davis',
    details: 'Asignó rol "Content Editor"',
    ipAddress: '192.168.1.100',
    status: 'success'
  },
  {
    id: 'audit-002',
    timestamp: '2026-02-09 11:22:08',
    actor: 'John Smith',
    action: 'create_role',
    resource: 'Role: HR Access',
    details: 'Creó nuevo rol personalizado',
    ipAddress: '192.168.1.100',
    status: 'success'
  },
  {
    id: 'audit-003',
    timestamp: '2026-02-09 09:15:33',
    actor: 'Sarah Johnson',
    action: 'update_user',
    resource: 'User: Mike Chen',
    details: 'Actualizó información de perfil',
    ipAddress: '192.168.1.105',
    status: 'success'
  },
  {
    id: 'audit-004',
    timestamp: '2026-02-08 16:45:22',
    actor: 'John Smith',
    action: 'upgrade_plan',
    resource: 'Subscription',
    details: 'Actualizó de Starter a Professional',
    ipAddress: '192.168.1.100',
    status: 'success'
  },
  {
    id: 'audit-005',
    timestamp: '2026-02-08 14:10:19',
    actor: 'System',
    action: 'login_failed',
    resource: 'User: unknown@acme.com',
    details: 'Intento de login fallido - credenciales inválidas',
    ipAddress: '203.0.113.42',
    status: 'failed'
  }
];

export const invoices = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-002',
    status: 'paid',
    amount: 99.00,
    currency: 'USD',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    issuedAt: '2026-02-01',
    paidAt: '2026-02-01',
    pdfUrl: '#'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-001',
    status: 'paid',
    amount: 99.00,
    currency: 'USD',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    issuedAt: '2026-01-01',
    paidAt: '2026-01-02',
    pdfUrl: '#'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2025-012',
    status: 'paid',
    amount: 29.00,
    currency: 'USD',
    periodStart: '2025-12-01',
    periodEnd: '2025-12-31',
    issuedAt: '2025-12-01',
    paidAt: '2025-12-01',
    pdfUrl: '#'
  }
];

// Tasks mock data
export const tasks = [
  {
    id: 'task-001',
    title: 'Implementar autenticación JWT',
    description: 'Desarrollar sistema de autenticación con tokens JWT para la API REST',
    status: 'in_progress',
    priority: 'alta',
    assignee: 'user-003',
    createdBy: 'user-002',
    dueDate: '2026-02-15',
    tags: ['backend', 'security'],
    comments: 3,
    subtasks: [
      { id: 'st-001', title: 'Configurar JWT library', completed: true },
      { id: 'st-002', title: 'Crear endpoints login/logout', completed: true },
      { id: 'st-003', title: 'Implementar refresh tokens', completed: false }
    ],
    createdAt: '2026-02-01'
  },
  {
    id: 'task-002',
    title: 'Diseñar wireframes dashboard',
    description: 'Crear wireframes de baja fidelidad para el nuevo dashboard de analytics',
    status: 'in_review',
    priority: 'media',
    assignee: 'user-004',
    createdBy: 'user-002',
    dueDate: '2026-02-12',
    tags: ['design', 'ux'],
    comments: 7,
    subtasks: [],
    createdAt: '2026-02-05'
  },
  {
    id: 'task-003',
    title: 'Optimizar queries de base de datos',
    description: 'Añadir índices y optimizar queries lentos identificados en el análisis de performance',
    status: 'todo',
    priority: 'alta',
    assignee: 'user-003',
    createdBy: 'user-001',
    dueDate: '2026-02-20',
    tags: ['backend', 'performance', 'database'],
    comments: 1,
    subtasks: [],
    createdAt: '2026-02-08'
  },
  {
    id: 'task-004',
    title: 'Escribir documentación API',
    description: 'Documentar todos los endpoints REST con ejemplos de request/response',
    status: 'todo',
    priority: 'baja',
    assignee: 'user-003',
    createdBy: 'user-001',
    dueDate: '2026-02-28',
    tags: ['docs'],
    comments: 0,
    subtasks: [],
    createdAt: '2026-02-09'
  },
  {
    id: 'task-005',
    title: 'Configurar CI/CD pipeline',
    description: 'Setup GitHub Actions para testing automático y deployment',
    status: 'done',
    priority: 'media',
    assignee: 'user-003',
    createdBy: 'user-002',
    dueDate: '2026-02-10',
    tags: ['devops', 'automation'],
    comments: 5,
    subtasks: [
      { id: 'st-004', title: 'Configurar test runner', completed: true },
      { id: 'st-005', title: 'Setup staging deployment', completed: true }
    ],
    createdAt: '2026-01-28'
  },
  {
    id: 'task-006',
    title: 'Revisar PR #234',
    description: 'Code review del nuevo feature de notificaciones en tiempo real',
    status: 'in_progress',
    priority: 'media',
    assignee: 'user-002',
    createdBy: 'user-003',
    dueDate: '2026-02-11',
    tags: ['review', 'backend'],
    comments: 12,
    subtasks: [],
    createdAt: '2026-02-09'
  }
];

// Calendar events mock data
export const events = [
  {
    id: 'event-001',
    title: 'Sprint Planning Q1',
    description: 'Planificación de sprint para el primer trimestre',
    startDate: '2026-02-12',
    startTime: '10:00',
    endDate: '2026-02-12',
    endTime: '12:00',
    location: 'Sala de Conferencias A',
    category: 'meeting',
    categoryColor: '#3b82f6',
    participants: ['user-001', 'user-002', 'user-003'],
    isRecurring: false,
    recurrencePattern: null,
    reminders: [
      { type: 'email', minutesBefore: 60 },
      { type: 'notification', minutesBefore: 15 }
    ],
    createdBy: 'user-002',
    createdAt: '2026-02-05'
  },
  {
    id: 'event-002',
    title: 'Daily Standup',
    description: 'Reunión diaria del equipo de desarrollo',
    startDate: '2026-02-11',
    startTime: '09:15',
    endDate: '2026-02-11',
    endTime: '09:30',
    location: 'Zoom',
    category: 'standup',
    categoryColor: '#10b981',
    participants: ['user-002', 'user-003', 'user-004'],
    isRecurring: true,
    recurrencePattern: 'daily',
    reminders: [
      { type: 'notification', minutesBefore: 5 }
    ],
    createdBy: 'user-002',
    createdAt: '2026-01-15'
  },
  {
    id: 'event-003',
    title: 'Presentación Cliente - Dashboard Analytics',
    description: 'Demo del nuevo dashboard de analytics al cliente',
    startDate: '2026-02-18',
    startTime: '14:00',
    endDate: '2026-02-18',
    endTime: '15:30',
    location: 'Google Meet',
    category: 'client',
    categoryColor: '#f59e0b',
    participants: ['user-001', 'user-002', 'user-004'],
    isRecurring: false,
    recurrencePattern: null,
    reminders: [
      { type: 'email', minutesBefore: 1440 },
      { type: 'notification', minutesBefore: 30 }
    ],
    createdBy: 'user-001',
    createdAt: '2026-02-07'
  },
  {
    id: 'event-004',
    title: 'Code Review Session',
    description: 'Revisión semanal de código y mejores prácticas',
    startDate: '2026-02-14',
    startTime: '16:00',
    endDate: '2026-02-14',
    endTime: '17:00',
    location: 'Sala Dev',
    category: 'review',
    categoryColor: '#8b5cf6',
    participants: ['user-002', 'user-003'],
    isRecurring: true,
    recurrencePattern: 'weekly',
    reminders: [
      { type: 'notification', minutesBefore: 15 }
    ],
    createdBy: 'user-002',
    createdAt: '2026-01-20'
  }
];

// User dashboard statistics
export const userStats = {
  'user-001': {
    tasksCompleted: 24,
    tasksInProgress: 2,
    upcomingEvents: 3,
    overdueTasksCount: 0
  },
  'user-002': {
    tasksCompleted: 18,
    tasksInProgress: 1,
    upcomingEvents: 5,
    overdueTasksCount: 0
  },
  'user-003': {
    tasksCompleted: 31,
    tasksInProgress: 3,
    upcomingEvents: 4,
    overdueTasksCount: 1
  },
  'user-004': {
    tasksCompleted: 12,
    tasksInProgress: 1,
    upcomingEvents: 2,
    overdueTasksCount: 0
  },
  'user-005': {
    tasksCompleted: 0,
    tasksInProgress: 0,
    upcomingEvents: 0,
    overdueTasksCount: 0
  }
};

// Mapeo de permisos por rol
export const rolePermissions = {
  'OrgAdmin': [
    'users.*', 'roles.*', 'permissions.*', 'billing.*',
    'audit.*', 'settings.*', 'dashboard.read', 'content.*', 'projects.*',
    'tasks.*', 'calendar.*'
  ],
  'Manager': [
    'users.read', 'users.update', 'roles.read', 'projects.*', 'audit.read',
    'customers.read', 'dashboard.read', 'content.read', 'tasks.*', 'calendar.*'
  ],
  'Member': [
    'dashboard.read', 'projects.read', 'projects.create',
    'content.read', 'content.create', 'content.edit_own',
    'tasks.read', 'tasks.create', 'tasks.update', 'tasks.assign',
    'calendar.read', 'calendar.create', 'calendar.update'
  ],
  'Content Editor': [
    'dashboard.read', 'content.create', 'content.edit_own',
    'content.read', 'content.delete',
    'tasks.read', 'tasks.create', 'calendar.read', 'calendar.create'
  ],
  'Guest': [
    'dashboard.read', 'tasks.read', 'calendar.read'
  ],
  'HR Access': [
    'users.read', 'hr.*', 'dashboard.read',
    'tasks.read', 'tasks.create', 'calendar.*'
  ],
  'Engineering': [
    'projects.*', 'technical.*', 'content.read', 'dashboard.read',
    'tasks.*', 'calendar.*'
  ]
};

// Helper: Obtener todos los permisos de un usuario basado en sus roles
export const getUserPermissions = (userRoles) => {
  const allPermissions = new Set();

  userRoles.forEach(roleName => {
    const perms = rolePermissions[roleName] || [];
    perms.forEach(perm => allPermissions.add(perm));
  });

  return Array.from(allPermissions);
};

// Helper: Verificar si un permiso coincide con un pattern (soporte wildcards)
export const matchPermission = (userPermissions, requiredPermission) => {
  // OrgAdmin tiene acceso a todo
  if (userPermissions.includes('*')) return true;

  // Verificación exacta
  if (userPermissions.includes(requiredPermission)) return true;

  // Verificación con wildcards (ej: users.* matches users.create)
  const resourceMatch = userPermissions.find(perm => {
    if (perm.endsWith('.*')) {
      const resource = perm.replace('.*', '');
      return requiredPermission.startsWith(resource + '.');
    }
    return false;
  });

  return !!resourceMatch;
};
