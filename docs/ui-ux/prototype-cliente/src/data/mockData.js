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
