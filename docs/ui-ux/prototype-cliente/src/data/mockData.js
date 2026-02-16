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
  },
  // Eventos de PRUEBA para hoy (2026-02-15)
  {
    id: 'event-today-1',
    title: 'Daily Standup',
    description: 'Reunión diaria del equipo',
    startDate: '2026-02-15',
    startTime: '09:15',
    endDate: '2026-02-15',
    endTime: '09:30',
    location: 'Zoom',
    category: 'standup',
    categoryColor: '#10b981',
    participants: ['user-001', 'user-002'],
    isRecurring: true,
    recurrencePattern: 'daily',
    reminders: [{ type: 'notification', minutesBefore: 5 }],
    createdBy: 'user-001',
    createdAt: '2026-02-10'
  },
  {
    id: 'event-today-2',
    title: 'Code Review - Auth Module',
    description: 'Revisión del módulo de autenticación',
    startDate: '2026-02-15',
    startTime: '14:00',
    endDate: '2026-02-15',
    endTime: '15:00',
    location: 'Sala Dev',
    category: 'review',
    categoryColor: '#8b5cf6',
    participants: ['user-001', 'user-003'],
    isRecurring: false,
    reminders: [{ type: 'notification', minutesBefore: 15 }],
    createdBy: 'user-003',
    createdAt: '2026-02-14'
  },
  {
    id: 'event-today-3',
    title: 'Planning - Q1 Goals',
    description: 'Definición de objetivos Q1',
    startDate: '2026-02-15',
    startTime: '16:30',
    endDate: '2026-02-15',
    endTime: '18:00',
    location: 'Sala de Conferencias B',
    category: 'meeting',
    categoryColor: '#3b82f6',
    participants: ['user-001', 'user-002', 'user-003', 'user-004'],
    isRecurring: false,
    reminders: [
      { type: 'email', minutesBefore: 60 },
      { type: 'notification', minutesBefore: 30 }
    ],
    createdBy: 'user-002',
    createdAt: '2026-02-10'
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
    'dashboard.read', 'content.read', 'tasks.*', 'calendar.*'
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

// ==================== PROJECTS DATA ====================

// Projects mock data
export const projects = [
  {
    id: 'project-001',
    name: 'Sistema de Autenticación',
    description: 'Credenciales y configuración del sistema de autenticación JWT',
    status: 'active',
    color: '#3b82f6',
    startDate: '2026-01-15',
    endDate: '2026-03-30',
    owner: 'user-001',
    sectionsCount: 3,
    itemsCount: 12,
    membersCount: 4,
    createdAt: '2026-01-15',
    updatedAt: '2026-02-09'
  },
  {
    id: 'project-002',
    name: 'Infraestructura Cloud',
    description: 'Documentación y credenciales de servicios cloud (AWS, Azure)',
    status: 'active',
    color: '#10b981',
    startDate: '2026-02-01',
    endDate: null,
    owner: 'user-002',
    sectionsCount: 2,
    itemsCount: 8,
    membersCount: 3,
    createdAt: '2026-02-01',
    updatedAt: '2026-02-10'
  }
];

// Project sections mock data
export const projectSections = [
  // Project 001 sections
  {
    id: 'section-001',
    projectId: 'project-001',
    name: 'Credenciales de Producción',
    description: 'Accesos del ambiente de producción',
    color: '#ef4444',
    order: 1,
    itemsCount: 5,
    createdAt: '2026-01-15'
  },
  {
    id: 'section-002',
    projectId: 'project-001',
    name: 'Configuración JWT',
    description: 'Secrets y configuración de tokens',
    color: '#8b5cf6',
    order: 2,
    itemsCount: 4,
    createdAt: '2026-01-15'
  },
  {
    id: 'section-003',
    projectId: 'project-001',
    name: 'Documentación',
    description: 'Documentos y enlaces de referencia',
    color: '#3b82f6',
    order: 3,
    itemsCount: 3,
    createdAt: '2026-01-16'
  },
  // Project 002 sections
  {
    id: 'section-004',
    projectId: 'project-002',
    name: 'AWS Services',
    description: 'Credenciales y configuración de AWS',
    color: '#f59e0b',
    order: 1,
    itemsCount: 5,
    createdAt: '2026-02-01'
  },
  {
    id: 'section-005',
    projectId: 'project-002',
    name: 'Azure Services',
    description: 'Credenciales de Azure',
    color: '#06b6d4',
    order: 2,
    itemsCount: 3,
    createdAt: '2026-02-01'
  }
];

// Project items mock data
export const projectItems = [
  // Section 001 items (Credenciales de Producción)
  {
    id: 'item-001',
    sectionId: 'section-001',
    title: 'Database Admin',
    type: 'credential',
    description: 'Acceso admin a PostgreSQL producción',
    isFavorite: true,
    expiresAt: '2026-04-15',
    createdBy: 'user-001',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-20'
  },
  {
    id: 'item-002',
    sectionId: 'section-001',
    title: 'API Gateway Admin',
    type: 'credential',
    description: 'Credenciales del API Gateway',
    isFavorite: false,
    expiresAt: '2026-12-31',
    createdBy: 'user-001',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15'
  },
  {
    id: 'item-003',
    sectionId: 'section-001',
    title: 'Redis Cache',
    type: 'credential',
    description: 'Acceso a Redis producción',
    isFavorite: true,
    expiresAt: '2026-02-28',
    createdBy: 'user-003',
    createdAt: '2026-01-20',
    updatedAt: '2026-02-05'
  },
  // Section 002 items (Configuración JWT)
  {
    id: 'item-004',
    sectionId: 'section-002',
    title: 'JWT Secret Key',
    type: 'config',
    description: 'Secret key para firma de tokens JWT',
    isFavorite: true,
    expiresAt: null,
    createdBy: 'user-001',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15'
  },
  {
    id: 'item-005',
    sectionId: 'section-002',
    title: 'Refresh Token Config',
    type: 'config',
    description: 'Configuración de refresh tokens',
    isFavorite: false,
    expiresAt: null,
    createdBy: 'user-001',
    createdAt: '2026-01-16',
    updatedAt: '2026-01-16'
  },
  // Section 003 items (Documentación)
  {
    id: 'item-006',
    sectionId: 'section-003',
    title: 'JWT Best Practices',
    type: 'link',
    description: 'Guía de mejores prácticas para JWT',
    isFavorite: false,
    expiresAt: null,
    createdBy: 'user-001',
    createdAt: '2026-01-16',
    updatedAt: '2026-01-16'
  },
  {
    id: 'item-007',
    sectionId: 'section-003',
    title: 'Architecture Diagram',
    type: 'document',
    description: 'Diagrama de arquitectura del sistema',
    isFavorite: true,
    expiresAt: null,
    createdBy: 'user-002',
    createdAt: '2026-01-18',
    updatedAt: '2026-02-01'
  },
  {
    id: 'item-008',
    sectionId: 'section-003',
    title: 'Notas de Implementación',
    type: 'note',
    description: 'Decisiones de diseño y notas técnicas',
    isFavorite: false,
    expiresAt: null,
    createdBy: 'user-003',
    createdAt: '2026-01-20',
    updatedAt: '2026-02-05'
  },
  // Section 004 items (AWS Services)
  {
    id: 'item-009',
    sectionId: 'section-004',
    title: 'AWS Root Account',
    type: 'credential',
    description: 'Cuenta raíz de AWS',
    isFavorite: true,
    expiresAt: '2026-06-30',
    createdBy: 'user-002',
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01'
  },
  {
    id: 'item-010',
    sectionId: 'section-004',
    title: 'S3 Configuration',
    type: 'config',
    description: 'Configuración de buckets S3',
    isFavorite: false,
    expiresAt: null,
    createdBy: 'user-002',
    createdAt: '2026-02-02',
    updatedAt: '2026-02-02'
  },
  {
    id: 'item-011',
    sectionId: 'section-004',
    title: 'AWS Console',
    type: 'link',
    description: 'Acceso a consola de AWS',
    isFavorite: true,
    expiresAt: null,
    createdBy: 'user-002',
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01'
  },
  // Section 005 items (Azure Services)
  {
    id: 'item-012',
    sectionId: 'section-005',
    title: 'Azure AD Admin',
    type: 'credential',
    description: 'Administrador de Azure Active Directory',
    isFavorite: true,
    expiresAt: '2026-05-15',
    createdBy: 'user-002',
    createdAt: '2026-02-01',
    updatedAt: '2026-02-01'
  }
];

// Project item fields mock data (campos dinámicos por item)
export const projectItemFields = [
  // Item 001 - Database Admin (credential)
  { id: 'field-001', itemId: 'item-001', fieldName: 'username', fieldType: 'text', fieldValue: 'db_admin', isEncrypted: false, order: 1 },
  { id: 'field-002', itemId: 'item-001', fieldName: 'password', fieldType: 'password', fieldValue: '••••••••••••', isEncrypted: true, order: 2 },
  { id: 'field-003', itemId: 'item-001', fieldName: 'email', fieldType: 'email', fieldValue: 'dba@acme.com', isEncrypted: false, order: 3 },
  { id: 'field-004', itemId: 'item-001', fieldName: 'url', fieldType: 'url', fieldValue: 'postgresql://prod.acme.com:5432', isEncrypted: false, order: 4 },
  { id: 'field-005', itemId: 'item-001', fieldName: 'notes', fieldType: 'text', fieldValue: 'Requiere VPN para acceso', isEncrypted: false, order: 5 },

  // Item 002 - API Gateway Admin (credential)
  { id: 'field-006', itemId: 'item-002', fieldName: 'username', fieldType: 'text', fieldValue: 'api_admin', isEncrypted: false, order: 1 },
  { id: 'field-007', itemId: 'item-002', fieldName: 'password', fieldType: 'password', fieldValue: '••••••••••••', isEncrypted: true, order: 2 },
  { id: 'field-008', itemId: 'item-002', fieldName: 'url', fieldType: 'url', fieldValue: 'https://api.acme.com/admin', isEncrypted: false, order: 3 },

  // Item 003 - Redis Cache (credential)
  { id: 'field-009', itemId: 'item-003', fieldName: 'username', fieldType: 'text', fieldValue: 'redis_user', isEncrypted: false, order: 1 },
  { id: 'field-010', itemId: 'item-003', fieldName: 'password', fieldType: 'password', fieldValue: '••••••••••••', isEncrypted: true, order: 2 },
  { id: 'field-011', itemId: 'item-003', fieldName: 'url', fieldType: 'url', fieldValue: 'redis://cache.acme.com:6379', isEncrypted: false, order: 3 },
  { id: 'field-012', itemId: 'item-003', fieldName: 'notes', fieldType: 'text', fieldValue: 'Expira pronto - renovar', isEncrypted: false, order: 4 },

  // Item 004 - JWT Secret Key (config)
  { id: 'field-013', itemId: 'item-004', fieldName: 'key', fieldType: 'text', fieldValue: 'JWT_SECRET_KEY', isEncrypted: false, order: 1 },
  { id: 'field-014', itemId: 'item-004', fieldName: 'value', fieldType: 'password', fieldValue: '••••••••••••', isEncrypted: true, order: 2 },
  { id: 'field-015', itemId: 'item-004', fieldName: 'environment', fieldType: 'text', fieldValue: 'production', isEncrypted: false, order: 3 },

  // Item 005 - Refresh Token Config (config)
  { id: 'field-016', itemId: 'item-005', fieldName: 'key', fieldType: 'text', fieldValue: 'REFRESH_TOKEN_EXPIRY', isEncrypted: false, order: 1 },
  { id: 'field-017', itemId: 'item-005', fieldName: 'value', fieldType: 'text', fieldValue: '7d', isEncrypted: false, order: 2 },
  { id: 'field-018', itemId: 'item-005', fieldName: 'environment', fieldType: 'text', fieldValue: 'production', isEncrypted: false, order: 3 },

  // Item 006 - JWT Best Practices (link)
  { id: 'field-019', itemId: 'item-006', fieldName: 'url', fieldType: 'url', fieldValue: 'https://jwt.io/introduction', isEncrypted: false, order: 1 },
  { id: 'field-020', itemId: 'item-006', fieldName: 'description', fieldType: 'text', fieldValue: 'Guía oficial de JWT.io', isEncrypted: false, order: 2 },
  { id: 'field-021', itemId: 'item-006', fieldName: 'category', fieldType: 'text', fieldValue: 'documentation', isEncrypted: false, order: 3 },

  // Item 007 - Architecture Diagram (document)
  { id: 'field-022', itemId: 'item-007', fieldName: 'file_url', fieldType: 'url', fieldValue: 'https://drive.google.com/file/d/abc123', isEncrypted: false, order: 1 },
  { id: 'field-023', itemId: 'item-007', fieldName: 'version', fieldType: 'text', fieldValue: 'v2.1', isEncrypted: false, order: 2 },
  { id: 'field-024', itemId: 'item-007', fieldName: 'last_reviewed', fieldType: 'date', fieldValue: '2026-02-01', isEncrypted: false, order: 3 },
  { id: 'field-025', itemId: 'item-007', fieldName: 'author', fieldType: 'text', fieldValue: 'Sarah Johnson', isEncrypted: false, order: 4 },

  // Item 008 - Notas de Implementación (note)
  { id: 'field-026', itemId: 'item-008', fieldName: 'content', fieldType: 'text', fieldValue: 'Usar RS256 para firma de tokens. Implementar refresh token rotation.', isEncrypted: false, order: 1 },
  { id: 'field-027', itemId: 'item-008', fieldName: 'tags', fieldType: 'text', fieldValue: 'security, jwt, implementation', isEncrypted: false, order: 2 },

  // Item 009 - AWS Root Account (credential)
  { id: 'field-028', itemId: 'item-009', fieldName: 'username', fieldType: 'email', fieldValue: 'aws-root@acme.com', isEncrypted: false, order: 1 },
  { id: 'field-029', itemId: 'item-009', fieldName: 'password', fieldType: 'password', fieldValue: '••••••••••••', isEncrypted: true, order: 2 },
  { id: 'field-030', itemId: 'item-009', fieldName: 'url', fieldType: 'url', fieldValue: 'https://console.aws.amazon.com', isEncrypted: false, order: 3 },
  { id: 'field-031', itemId: 'item-009', fieldName: 'notes', fieldType: 'text', fieldValue: 'MFA habilitado', isEncrypted: false, order: 4 },

  // Item 010 - S3 Configuration (config)
  { id: 'field-032', itemId: 'item-010', fieldName: 'key', fieldType: 'text', fieldValue: 'S3_BUCKET_NAME', isEncrypted: false, order: 1 },
  { id: 'field-033', itemId: 'item-010', fieldName: 'value', fieldType: 'text', fieldValue: 'acme-prod-files', isEncrypted: false, order: 2 },
  { id: 'field-034', itemId: 'item-010', fieldName: 'environment', fieldType: 'text', fieldValue: 'production', isEncrypted: false, order: 3 },

  // Item 011 - AWS Console (link)
  { id: 'field-035', itemId: 'item-011', fieldName: 'url', fieldType: 'url', fieldValue: 'https://console.aws.amazon.com', isEncrypted: false, order: 1 },
  { id: 'field-036', itemId: 'item-011', fieldName: 'description', fieldType: 'text', fieldValue: 'Consola de administración AWS', isEncrypted: false, order: 2 },

  // Item 012 - Azure AD Admin (credential)
  { id: 'field-037', itemId: 'item-012', fieldName: 'username', fieldType: 'email', fieldValue: 'admin@acme.onmicrosoft.com', isEncrypted: false, order: 1 },
  { id: 'field-038', itemId: 'item-012', fieldName: 'password', fieldType: 'password', fieldValue: '••••••••••••', isEncrypted: true, order: 2 },
  { id: 'field-039', itemId: 'item-012', fieldName: 'url', fieldType: 'url', fieldValue: 'https://portal.azure.com', isEncrypted: false, order: 3 }
];

// Project members mock data (roles granulares por proyecto)
export const projectMembers = [
  // Project 001 members
  { id: 'member-001', projectId: 'project-001', userId: 'user-001', role: 'owner', addedAt: '2026-01-15' },
  { id: 'member-002', projectId: 'project-001', userId: 'user-002', role: 'admin', addedAt: '2026-01-15' },
  { id: 'member-003', projectId: 'project-001', userId: 'user-003', role: 'editor', addedAt: '2026-01-20' },
  { id: 'member-004', projectId: 'project-001', userId: 'user-004', role: 'viewer', addedAt: '2026-01-25' },

  // Project 002 members
  { id: 'member-005', projectId: 'project-002', userId: 'user-002', role: 'owner', addedAt: '2026-02-01' },
  { id: 'member-006', projectId: 'project-002', userId: 'user-001', role: 'admin', addedAt: '2026-02-01' },
  { id: 'member-007', projectId: 'project-002', userId: 'user-003', role: 'editor', addedAt: '2026-02-02' }
];

// Item type field templates (campos predefinidos por tipo de item)
export const itemTypeFieldTemplates = {
  credential: [
    { fieldName: 'username', fieldType: 'text', required: true, placeholder: 'Usuario o email' },
    { fieldName: 'password', fieldType: 'password', required: true, placeholder: 'Contraseña' },
    { fieldName: 'email', fieldType: 'email', required: false, placeholder: 'Email asociado' },
    { fieldName: 'url', fieldType: 'url', required: false, placeholder: 'URL del servicio' },
    { fieldName: 'notes', fieldType: 'text', required: false, placeholder: 'Notas adicionales' }
  ],
  document: [
    { fieldName: 'file_url', fieldType: 'url', required: true, placeholder: 'URL del documento' },
    { fieldName: 'version', fieldType: 'text', required: false, placeholder: 'v1.0' },
    { fieldName: 'last_reviewed', fieldType: 'date', required: false, placeholder: 'Última revisión' },
    { fieldName: 'author', fieldType: 'text', required: false, placeholder: 'Autor del documento' }
  ],
  link: [
    { fieldName: 'url', fieldType: 'url', required: true, placeholder: 'https://...' },
    { fieldName: 'description', fieldType: 'text', required: false, placeholder: 'Descripción del enlace' },
    { fieldName: 'category', fieldType: 'text', required: false, placeholder: 'Categoría' }
  ],
  note: [
    { fieldName: 'content', fieldType: 'text', required: true, placeholder: 'Contenido de la nota' },
    { fieldName: 'tags', fieldType: 'text', required: false, placeholder: 'tag1, tag2, tag3' }
  ],
  config: [
    { fieldName: 'key', fieldType: 'text', required: true, placeholder: 'CONFIG_KEY' },
    { fieldName: 'value', fieldType: 'text', required: true, placeholder: 'Valor de configuración' },
    { fieldName: 'environment', fieldType: 'text', required: false, placeholder: 'production, staging, dev' },
    { fieldName: 'secret_key', fieldType: 'password', required: false, placeholder: 'Secreto (si aplica)' }
  ]
};

// Helper: Get sections by project ID
export const getSectionsByProject = (projectId) => {
  return projectSections.filter(section => section.projectId === projectId)
    .sort((a, b) => a.order - b.order);
};

// Helper: Get items by section ID
export const getItemsBySection = (sectionId) => {
  return projectItems.filter(item => item.sectionId === sectionId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

// Helper: Get fields by item ID
export const getFieldsByItem = (itemId) => {
  return projectItemFields.filter(field => field.itemId === itemId)
    .sort((a, b) => a.order - b.order);
};

// Helper: Get members by project ID
export const getMembersByProject = (projectId) => {
  return projectMembers.filter(member => member.projectId === projectId);
};

// Helper: Get user role in project
export const getUserRoleInProject = (userId, projectId) => {
  const member = projectMembers.find(m => m.userId === userId && m.projectId === projectId);
  return member?.role || null;
};

// Helper: Check if user can access project
export const canAccessProject = (userId, projectId, requiredRole = 'viewer') => {
  const roleHierarchy = { viewer: 1, editor: 2, admin: 3, owner: 4 };
  const userRole = getUserRoleInProject(userId, projectId);

  if (!userRole) return false;

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Helper: Get total items count for a project
export const getProjectItemsCount = (projectId) => {
  const sections = getSectionsByProject(projectId);
  return sections.reduce((total, section) => {
    return total + getItemsBySection(section.id).length;
  }, 0);
};

// ============================================================
// SHARING & COLLABORATION DATA
// ============================================================

/**
 * Shares - Compartición de elementos entre usuarios
 *
 * resourceType: 'project' | 'project_section' | 'project_item' | 'task' | 'event' | 'file' | 'document' | 'note'
 * accessLevel: 'viewer' | 'commenter' | 'editor' | 'admin'
 * isInherited: true si el share viene heredado de un recurso padre (ej: project → section → item)
 */
export const shares = [
  // ========== PROJECT SHARES ==========
  {
    id: 'share-001',
    resourceType: 'project',
    resourceId: 'project-001',
    resourceName: 'Sistema de Autenticación',
    sharedWith: 'user-002', // Sarah Johnson
    sharedWithName: 'Sarah Johnson',
    sharedWithEmail: 'sarah.johnson@acme.com',
    sharedBy: 'user-001', // John Smith (owner)
    sharedByName: 'John Smith',
    accessLevel: 'editor',
    isInherited: false,
    message: 'Te doy acceso para configurar los secrets JWT',
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-01-20T10:30:00Z'
  },
  {
    id: 'share-002',
    resourceType: 'project',
    resourceId: 'project-001',
    resourceName: 'Sistema de Autenticación',
    sharedWith: 'user-003', // Mike Chen
    sharedWithName: 'Mike Chen',
    sharedWithEmail: 'mike.chen@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'viewer',
    isInherited: false,
    message: 'Solo lectura para revisión de documentación',
    expiresAt: '2026-03-01T23:59:59Z',
    canDelegate: false,
    createdAt: '2026-01-22T14:15:00Z',
    updatedAt: '2026-01-22T14:15:00Z'
  },
  {
    id: 'share-003',
    resourceType: 'project',
    resourceId: 'project-002',
    resourceName: 'Infraestructura Cloud',
    sharedWith: 'user-003', // Mike Chen
    sharedWithName: 'Mike Chen',
    sharedWithEmail: 'mike.chen@acme.com',
    sharedBy: 'user-002', // Sarah Johnson (owner)
    sharedByName: 'Sarah Johnson',
    accessLevel: 'admin',
    isInherited: false,
    message: 'Gestiona AWS y Azure conmigo',
    expiresAt: null,
    canDelegate: true, // Enterprise feature
    createdAt: '2026-02-03T09:00:00Z',
    updatedAt: '2026-02-03T09:00:00Z'
  },

  // ========== SECTION SHARES (Inherited + Local) ==========
  {
    id: 'share-004',
    resourceType: 'project_section',
    resourceId: 'section-001',
    resourceName: 'Credenciales de Producción',
    parentResourceType: 'project',
    parentResourceId: 'project-001',
    parentResourceName: 'Sistema de Autenticación',
    sharedWith: 'user-002',
    sharedWithName: 'Sarah Johnson',
    sharedWithEmail: 'sarah.johnson@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'editor',
    isInherited: true, // Heredado de project-001
    message: null,
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-01-20T10:30:00Z'
  },
  {
    id: 'share-005',
    resourceType: 'project_section',
    resourceId: 'section-002',
    resourceName: 'Configuración JWT',
    parentResourceType: 'project',
    parentResourceId: 'project-001',
    parentResourceName: 'Sistema de Autenticación',
    sharedWith: 'user-004', // Emma Davis
    sharedWithName: 'Emma Davis',
    sharedWithEmail: 'emma.davis@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'viewer',
    isInherited: false, // Share local específico para esta sección
    message: 'Revisa la config de JWT por favor',
    expiresAt: '2026-02-20T23:59:59Z',
    canDelegate: false,
    createdAt: '2026-02-05T11:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z'
  },

  // ========== ITEM SHARES (Inherited + Local) ==========
  {
    id: 'share-006',
    resourceType: 'project_item',
    resourceId: 'item-001',
    resourceName: 'Database Admin',
    parentResourceType: 'project_section',
    parentResourceId: 'section-001',
    parentResourceName: 'Credenciales de Producción',
    sharedWith: 'user-002',
    sharedWithName: 'Sarah Johnson',
    sharedWithEmail: 'sarah.johnson@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'editor',
    isInherited: true, // Heredado de project-001 → section-001
    message: null,
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-01-20T10:30:00Z'
  },
  {
    id: 'share-007',
    resourceType: 'project_item',
    resourceId: 'item-002',
    resourceName: 'Redis Cache Credentials',
    parentResourceType: 'project_section',
    parentResourceId: 'section-001',
    parentResourceName: 'Credenciales de Producción',
    sharedWith: 'user-003',
    sharedWithName: 'Mike Chen',
    sharedWithEmail: 'mike.chen@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'editor',
    isInherited: false, // Share local específico para este item
    message: 'Necesitas editar las credenciales de Redis',
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-01-25T16:45:00Z',
    updatedAt: '2026-01-25T16:45:00Z'
  },

  // ========== TASK SHARES ==========
  {
    id: 'share-008',
    resourceType: 'task',
    resourceId: 'task-001',
    resourceName: 'Implementar autenticación JWT',
    sharedWith: 'user-002',
    sharedWithName: 'Sarah Johnson',
    sharedWithEmail: 'sarah.johnson@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'editor',
    isInherited: false,
    message: 'Colabora conmigo en esta tarea',
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z'
  },
  {
    id: 'share-009',
    resourceType: 'task',
    resourceId: 'task-003',
    resourceName: 'Revisar código de seguridad',
    sharedWith: 'user-004',
    sharedWithName: 'Emma Davis',
    sharedWithEmail: 'emma.davis@acme.com',
    sharedBy: 'user-002',
    sharedByName: 'Sarah Johnson',
    accessLevel: 'commenter',
    isInherited: false,
    message: 'Déjame tus comentarios sobre el código',
    expiresAt: '2026-02-15T23:59:59Z',
    canDelegate: false,
    createdAt: '2026-02-07T10:30:00Z',
    updatedAt: '2026-02-07T10:30:00Z'
  },

  // ========== EVENT SHARES ==========
  {
    id: 'share-010',
    resourceType: 'event',
    resourceId: 'event-001',
    resourceName: 'Sprint Planning',
    sharedWith: 'user-003',
    sharedWithName: 'Mike Chen',
    sharedWithEmail: 'mike.chen@acme.com',
    sharedBy: 'user-001',
    sharedByName: 'John Smith',
    accessLevel: 'viewer',
    isInherited: false,
    message: 'Invitado a la reunión de planning',
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-02-09T14:00:00Z',
    updatedAt: '2026-02-09T14:00:00Z'
  },
  {
    id: 'share-011',
    resourceType: 'event',
    resourceId: 'event-002',
    resourceName: 'Code Review Session',
    sharedWith: 'user-002',
    sharedWithName: 'Sarah Johnson',
    sharedWithEmail: 'sarah.johnson@acme.com',
    sharedBy: 'user-003',
    sharedByName: 'Mike Chen',
    accessLevel: 'editor',
    isInherited: false,
    message: 'Co-host del evento',
    expiresAt: null,
    canDelegate: false,
    createdAt: '2026-02-10T09:15:00Z',
    updatedAt: '2026-02-10T09:15:00Z'
  }
];

// ============================================================
// SHARING HELPER FUNCTIONS
// ============================================================

/**
 * Get all shares for a specific resource
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @returns {Array} - Array of shares
 */
export const getSharesByResource = (resourceType, resourceId) => {
  return shares.filter(
    share => share.resourceType === resourceType && share.resourceId === resourceId
  );
};

/**
 * Get all elements shared with a specific user
 * @param {string} userId - User ID
 * @returns {Array} - Array of shares where user is recipient
 */
export const getSharedWithMeItems = (userId) => {
  return shares
    .filter(share => share.sharedWith === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Get all users who have access to a resource (including inherited)
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @returns {Array} - Array of users with their access level
 */
export const getUsersWithAccessToResource = (resourceType, resourceId) => {
  const directShares = getSharesByResource(resourceType, resourceId);

  // Create a map to handle multiple shares for same user (keep highest permission)
  const usersMap = new Map();

  directShares.forEach(share => {
    const existingShare = usersMap.get(share.sharedWith);
    if (!existingShare || compareAccessLevels(share.accessLevel, existingShare.accessLevel) > 0) {
      usersMap.set(share.sharedWith, share);
    }
  });

  return Array.from(usersMap.values());
};

/**
 * Check if a user has specific access level to a resource
 * @param {string} userId - User ID
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @param {string} requiredLevel - Required access level ('viewer', 'commenter', 'editor', 'admin')
 * @returns {boolean}
 */
export const hasAccessLevel = (userId, resourceType, resourceId, requiredLevel) => {
  const userShare = shares.find(
    share =>
      share.resourceType === resourceType &&
      share.resourceId === resourceId &&
      share.sharedWith === userId
  );

  if (!userShare) return false;

  // Check if user's access level meets requirement
  return compareAccessLevels(userShare.accessLevel, requiredLevel) >= 0;
};

/**
 * Calculate effective permission for a user on a resource (considers inheritance)
 * @param {string} userId - User ID
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @returns {Object|null} - { accessLevel, isInherited, inheritedFrom } or null
 */
export const calculateEffectivePermission = (userId, resourceType, resourceId) => {
  // Check for direct/local share first
  const localShare = shares.find(
    share =>
      share.resourceType === resourceType &&
      share.resourceId === resourceId &&
      share.sharedWith === userId &&
      !share.isInherited
  );

  if (localShare) {
    return {
      accessLevel: localShare.accessLevel,
      isInherited: false,
      shareId: localShare.id
    };
  }

  // Check for inherited share
  const inheritedShare = shares.find(
    share =>
      share.resourceType === resourceType &&
      share.resourceId === resourceId &&
      share.sharedWith === userId &&
      share.isInherited
  );

  if (inheritedShare) {
    return {
      accessLevel: inheritedShare.accessLevel,
      isInherited: true,
      inheritedFrom: inheritedShare.parentResourceType,
      inheritedFromId: inheritedShare.parentResourceId,
      inheritedFromName: inheritedShare.parentResourceName,
      shareId: inheritedShare.id
    };
  }

  return null;
};

/**
 * Compare two access levels
 * @param {string} level1 - First access level
 * @param {string} level2 - Second access level
 * @returns {number} - 1 if level1 > level2, -1 if level1 < level2, 0 if equal
 */
export const compareAccessLevels = (level1, level2) => {
  const hierarchy = {
    viewer: 1,
    commenter: 2,
    editor: 3,
    admin: 4
  };

  const value1 = hierarchy[level1] || 0;
  const value2 = hierarchy[level2] || 0;

  if (value1 > value2) return 1;
  if (value1 < value2) return -1;
  return 0;
};

/**
 * Get access level display name
 * @param {string} level - Access level key
 * @returns {string} - Display name in Spanish
 */
export const getAccessLevelDisplayName = (level) => {
  const displayNames = {
    viewer: 'Visualizador',
    commenter: 'Comentador',
    editor: 'Editor',
    admin: 'Administrador'
  };
  return displayNames[level] || level;
};

/**
 * Get permissions for an access level
 * @param {string} level - Access level
 * @returns {Object} - Permissions object
 */
export const getPermissionsForAccessLevel = (level) => {
  const permissions = {
    viewer: {
      canRead: true,
      canComment: false,
      canUpdate: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false
    },
    commenter: {
      canRead: true,
      canComment: true,
      canUpdate: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false
    },
    editor: {
      canRead: true,
      canComment: true,
      canUpdate: true,
      canDelete: false,
      canShare: false,
      canManagePermissions: false
    },
    admin: {
      canRead: true,
      canComment: true,
      canUpdate: true,
      canDelete: true,
      canShare: true,
      canManagePermissions: true
    }
  };

  return permissions[level] || permissions.viewer;
};

/**
 * Check if a share is expired
 * @param {Object} share - Share object
 * @returns {boolean}
 */
export const isShareExpired = (share) => {
  if (!share.expiresAt) return false;
  return new Date(share.expiresAt) < new Date();
};

/**
 * Filter active (non-expired) shares
 * @param {Array} sharesList - Array of shares
 * @returns {Array} - Active shares only
 */
export const filterActiveShares = (sharesList) => {
  return sharesList.filter(share => !isShareExpired(share));
};

// ===========================
// Landing Page Data
// ===========================

export const landingPageData = {
  features: [
    {
      id: 'feature-1',
      icon: 'Shield',
      title: 'RBAC Granular',
      description: 'Control de acceso a nivel de recurso con permisos personalizables',
      color: 'blue'
    },
    {
      id: 'feature-2',
      icon: 'CheckSquare',
      title: 'Gestión de Tareas',
      description: 'Tableros Kanban con prioridades y asignación de equipo',
      color: 'green'
    },
    {
      id: 'feature-3',
      icon: 'Calendar',
      title: 'Calendario Inteligente',
      description: 'Sincronización automática y recordatorios personalizados',
      color: 'purple'
    },
    {
      id: 'feature-4',
      icon: 'Lock',
      title: 'Proyectos Encriptados',
      description: 'AES-256 para proteger credenciales y datos sensibles',
      color: 'red'
    },
    {
      id: 'feature-5',
      icon: 'Share2',
      title: 'Compartición Segura',
      description: 'Permisos granulares con expiración automática',
      color: 'orange'
    },
    {
      id: 'feature-6',
      icon: 'Activity',
      title: 'Auditoría Completa',
      description: 'Logs inmutables exportables para cumplimiento normativo',
      color: 'indigo'
    }
  ],

  howItWorks: [
    {
      id: 'step-1',
      number: 1,
      icon: 'UserPlus',
      title: 'Registra tu Organización',
      description: 'Menos de 2 minutos, sin tarjeta de crédito requerida'
    },
    {
      id: 'step-2',
      number: 2,
      icon: 'ShieldCheck',
      title: 'Configura Roles y Permisos',
      description: 'Sistema intuitivo de gestión de accesos'
    },
    {
      id: 'step-3',
      number: 3,
      icon: 'Users',
      title: 'Invita a tu Equipo',
      description: 'Envía invitaciones por email con asignación de roles'
    },
    {
      id: 'step-4',
      number: 4,
      icon: 'Rocket',
      title: 'Comienza a Trabajar',
      description: 'Colaboración segura desde el primer día'
    }
  ],

  paymentMethods: [
    {
      id: 'payment-1',
      icon: 'CreditCard',
      name: 'Stripe',
      description: 'Procesador seguro de pagos'
    },
    {
      id: 'payment-2',
      icon: 'CreditCard',
      name: 'Tarjetas',
      description: 'Visa, Mastercard, Amex'
    },
    {
      id: 'payment-3',
      icon: 'Wallet',
      name: 'PayPal',
      description: 'Paga con tu cuenta PayPal'
    },
    {
      id: 'payment-4',
      icon: 'Building',
      name: 'Transferencia',
      description: 'Para planes Enterprise'
    }
  ],

  testimonials: [
    {
      id: 'testimonial-1',
      quote: 'Implementamos RBAC en solo 2 días. El sistema es increíblemente flexible y nos ahorró semanas de desarrollo.',
      author: 'Carlos Méndez',
      role: 'CTO',
      company: 'TechStart',
      avatar: 'CM',
      rating: 5
    },
    {
      id: 'testimonial-2',
      quote: 'La automatización de facturación nos ahorró más de 15 horas al mes. El soporte es excepcional.',
      author: 'Ana Martínez',
      role: 'Finance Director',
      company: 'Retail Solutions',
      avatar: 'AM',
      rating: 5
    },
    {
      id: 'testimonial-3',
      quote: 'Migramos de nuestro sistema legacy sin downtime. La documentación es clara y el equipo muy profesional.',
      author: 'Roberto Silva',
      role: 'IT Manager',
      company: 'Global Logistics',
      avatar: 'RS',
      rating: 5
    }
  ],

  faqs: [
    {
      id: 'faq-1',
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar o cambiar tu plan en cualquier momento desde el panel de administración. Los cambios se aplican inmediatamente y solo pagas la diferencia prorrateada.'
    },
    {
      id: 'faq-2',
      question: '¿Qué es RBAC y por qué lo necesito?',
      answer: 'RBAC (Role-Based Access Control) es un sistema de control de acceso que asigna permisos basados en roles. Es esencial para proteger datos sensibles, cumplir con normativas (GDPR, SOC2) y gestionar equipos de forma escalable.'
    },
    {
      id: 'faq-3',
      question: '¿Los datos están encriptados?',
      answer: 'Sí, todos los datos están encriptados en tránsito (TLS 1.3) y en reposo (AES-256). Los datos sensibles como contraseñas y credenciales tienen una capa adicional de encriptación a nivel de aplicación.'
    },
    {
      id: 'faq-4',
      question: '¿Puedo cancelar mi suscripción?',
      answer: 'Puedes cancelar tu suscripción en cualquier momento sin penalización. Tendrás acceso completo hasta el final de tu período de facturación actual. Tus datos se mantienen disponibles durante 30 días después de la cancelación.'
    },
    {
      id: 'faq-5',
      question: '¿Ofrecen período de prueba?',
      answer: 'El plan Free es gratuito para siempre y no requiere tarjeta de crédito. Para planes pagos, ofrecemos garantía de devolución de 30 días sin preguntas.'
    },
    {
      id: 'faq-6',
      question: '¿Qué soporte está incluido?',
      answer: 'El plan Free incluye documentación completa y comunidad. Starter incluye soporte por email (respuesta en 24h). Professional incluye soporte prioritario (respuesta en 4h). Enterprise incluye soporte dedicado 24/7 con SLA garantizado.'
    }
  ]
};

// Promociones activas para Landing Page
export const specialPromotions = [
  {
    id: 'promo-summer-2026',
    discount: '20% OFF',
    title: {
      es: 'Promoción de Verano 2026',
      en: 'Summer Promotion 2026'
    },
    description: {
      es: 'Descuento especial para nuevos clientes durante la temporada de verano',
      en: 'Special discount for new customers during summer season'
    },
    code: 'SUMMER2026',
    validUntil: {
      es: '31 Ago 2026',
      en: 'Aug 31, 2026'
    },
    limited: true,
    cta: {
      es: 'Aprovechar oferta',
      en: 'Claim offer'
    }
  },
  {
    id: 'promo-startup-50',
    discount: '$50 OFF',
    title: {
      es: 'Descuento para Startups',
      en: 'Startup Discount'
    },
    description: {
      es: '$50 de descuento en el primer mes para startups verificadas',
      en: '$50 off first month for verified startups'
    },
    code: 'STARTUP50',
    validUntil: {
      es: '31 Dic 2026',
      en: 'Dec 31, 2026'
    },
    limited: false,
    cta: {
      es: 'Obtener descuento',
      en: 'Get discount'
    }
  },
  {
    id: 'promo-trial-30',
    discount: '+30 DÍAS',
    title: {
      es: 'Trial Extendido',
      en: 'Extended Trial'
    },
    description: {
      es: '30 días adicionales de prueba gratuita para nuevos usuarios',
      en: '30 additional days of free trial for new users'
    },
    code: 'TRIAL30',
    validUntil: {
      es: '31 May 2026',
      en: 'May 31, 2026'
    },
    limited: true,
    cta: {
      es: 'Activar trial',
      en: 'Activate trial'
    }
  }
];

// ============================================================================
// Settings Mock Data
// ============================================================================

export const userSettings = {
  id: 'settings-001',
  userId: 'user-001', // Matches currentUser.id
  profile: {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@acme.com',
    avatar: null
  },
  preferences: {
    language: 'es', // 'es' | 'en'
    theme: 'light', // 'light' | 'dark' | 'auto'
    dateFormat: 'DD/MM/YYYY', // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
    timezone: 'America/Mexico_City'
  },
  notifications: {
    emailNotifications: true,
    taskReminders: true,
    projectUpdates: true,
    sharedItems: true,
    inAppNotifications: true
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: '2025-11-15'
  }
};

// Helper function para obtener settings del usuario actual
export const getUserSettings = (userId) => {
  // En producción, esto haría fetch a /api/users/{userId}/settings
  return userSettings;
};
