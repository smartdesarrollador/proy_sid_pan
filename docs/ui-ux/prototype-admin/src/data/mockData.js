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
  role: 'Owner',
  avatar: null,
  mfaEnabled: true,
  permissions: ['users.*', 'roles.*', 'tasks.*', 'boards.*', 'calendar.*', 'landing.*', 'branding.*', 'forms.*', 'projects.*', 'credentials.*', 'portfolio.*', 'digital_services.*', 'billing.*', 'promotions.*', 'analytics.*', 'settings.*', 'audit.*', 'dashboard.*']
};

export const users = [
  {
    id: 'user-001',
    email: 'admin@acme.com',
    firstName: 'John',
    lastName: 'Smith',
    roles: ['Owner'],
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
    roles: ['Service Manager'],
    status: 'active',
    lastLogin: '2026-02-09 09:15',
    mfaEnabled: true,
    createdAt: '2025-12-03',
    migration_review_required: true // HR Access deprecado
  },
  {
    id: 'user-003',
    email: 'mike.chen@acme.com',
    firstName: 'Mike',
    lastName: 'Chen',
    roles: ['Member', 'Portfolio Admin'],
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
    roles: ['Viewer'],
    status: 'pending',
    lastLogin: null,
    mfaEnabled: false,
    createdAt: '2026-02-08'
  }
];

export const roles = [
  // === SYSTEM ROLES ===
  {
    id: 'role-001',
    name: 'Owner',
    description: 'Propietario con acceso administrativo completo a todos los servicios',
    isSystemRole: true,
    usersCount: 1,
    permissionsCount: 60,
    color: '#dc2626',
    parentRole: null,
    createdAt: '2025-12-01'
  },
  {
    id: 'role-002',
    name: 'Service Manager',
    description: 'Gestiona equipo y supervisa todos los servicios web',
    isSystemRole: true,
    usersCount: 3,
    permissionsCount: 40,
    color: '#ea580c',
    parentRole: null,
    createdAt: '2025-12-01'
  },
  {
    id: 'role-003',
    name: 'Member',
    description: 'Miembro estándar con acceso a servicios principales',
    isSystemRole: true,
    usersCount: 15,
    permissionsCount: 20,
    color: '#3b82f6',
    parentRole: null,
    createdAt: '2025-12-01'
  },
  {
    id: 'role-004',
    name: 'Viewer',
    description: 'Acceso de solo lectura a dashboards y contenido compartido',
    isSystemRole: true,
    usersCount: 4,
    permissionsCount: 8,
    color: '#6b7280',
    parentRole: null,
    createdAt: '2025-12-01'
  },

  // === SERVICE-SPECIFIC ROLES ===
  {
    id: 'role-005',
    name: 'Landing Manager',
    description: 'Control total de landing pages, branding y formularios',
    isSystemRole: false,
    usersCount: 0,
    permissionsCount: 25,
    color: '#8b5cf6',
    parentRole: 'Member',
    createdAt: '2026-02-16'
  },
  {
    id: 'role-006',
    name: 'Portfolio Admin',
    description: 'Gestión de proyectos, credenciales y portfolios públicos',
    isSystemRole: false,
    usersCount: 0,
    permissionsCount: 22,
    color: '#10b981',
    parentRole: 'Member',
    createdAt: '2026-02-16'
  },
  {
    id: 'role-007',
    name: 'Task Coordinator',
    description: 'Gestión de tareas, tableros Kanban y calendario',
    isSystemRole: false,
    usersCount: 0,
    permissionsCount: 18,
    color: '#f59e0b',
    parentRole: 'Member',
    createdAt: '2026-02-16'
  },
  {
    id: 'role-008',
    name: 'Content Editor',
    description: 'Edición de contenido y páginas (requiere aprobación para publicar)',
    isSystemRole: false,
    usersCount: 8,
    permissionsCount: 15,
    color: '#ec4899',
    parentRole: 'Member',
    createdAt: '2026-01-20'
  },

  // === CUSTOMER/BILLING ROLES ===
  {
    id: 'role-009',
    name: 'Customer Success Manager',
    description: 'Gestión de clientes, onboarding, soporte y retención',
    isSystemRole: false,
    usersCount: 0,
    permissionsCount: 18,
    color: '#06b6d4',
    parentRole: null,
    createdAt: '2026-02-16'
  },
  {
    id: 'role-010',
    name: 'Billing Manager',
    description: 'Gestión de facturación, planes, promociones y pagos',
    isSystemRole: false,
    usersCount: 0,
    permissionsCount: 14,
    color: '#0ea5e9',
    parentRole: null,
    createdAt: '2026-02-16'
  }
];

export const permissions = [
  // === Users & Authentication (5) ===
  { id: 'perm-001', codename: 'users.create', name: 'Crear Usuarios', resource: 'users', action: 'create', category: 'Users' },
  { id: 'perm-002', codename: 'users.read', name: 'Ver Usuarios', resource: 'users', action: 'read', category: 'Users' },
  { id: 'perm-003', codename: 'users.update', name: 'Editar Usuarios', resource: 'users', action: 'update', category: 'Users' },
  { id: 'perm-004', codename: 'users.delete', name: 'Eliminar Usuarios', resource: 'users', action: 'delete', category: 'Users' },
  { id: 'perm-005', codename: 'users.invite', name: 'Invitar Usuarios', resource: 'users', action: 'invite', category: 'Users' },

  // === Roles & Permissions (5) ===
  { id: 'perm-006', codename: 'roles.create', name: 'Crear Roles', resource: 'roles', action: 'create', category: 'Roles' },
  { id: 'perm-007', codename: 'roles.read', name: 'Ver Roles', resource: 'roles', action: 'read', category: 'Roles' },
  { id: 'perm-008', codename: 'roles.update', name: 'Editar Roles', resource: 'roles', action: 'update', category: 'Roles' },
  { id: 'perm-009', codename: 'roles.delete', name: 'Eliminar Roles', resource: 'roles', action: 'delete', category: 'Roles' },
  { id: 'perm-010', codename: 'roles.assign', name: 'Asignar Roles', resource: 'roles', action: 'assign', category: 'Roles' },

  // === Tasks Service (7) ===
  { id: 'perm-011', codename: 'tasks.create', name: 'Crear Tareas', resource: 'tasks', action: 'create', category: 'Tasks' },
  { id: 'perm-012', codename: 'tasks.read', name: 'Ver Tareas', resource: 'tasks', action: 'read', category: 'Tasks' },
  { id: 'perm-013', codename: 'tasks.update', name: 'Editar Tareas', resource: 'tasks', action: 'update', category: 'Tasks' },
  { id: 'perm-014', codename: 'tasks.delete', name: 'Eliminar Tareas', resource: 'tasks', action: 'delete', category: 'Tasks' },
  { id: 'perm-015', codename: 'tasks.assign', name: 'Asignar Tareas', resource: 'tasks', action: 'assign', category: 'Tasks' },
  { id: 'perm-016', codename: 'boards.admin', name: 'Gestionar Tableros Kanban', resource: 'boards', action: 'admin', category: 'Tasks' },
  { id: 'perm-017', codename: 'boards.reorder', name: 'Reordenar Tareas/Columnas', resource: 'boards', action: 'reorder', category: 'Tasks' },

  // === Calendar Service (6) ===
  { id: 'perm-018', codename: 'calendar.create', name: 'Crear Eventos', resource: 'calendar', action: 'create', category: 'Calendar' },
  { id: 'perm-019', codename: 'calendar.read', name: 'Ver Calendario', resource: 'calendar', action: 'read', category: 'Calendar' },
  { id: 'perm-020', codename: 'calendar.update', name: 'Editar Eventos', resource: 'calendar', action: 'update', category: 'Calendar' },
  { id: 'perm-021', codename: 'calendar.delete', name: 'Eliminar Eventos', resource: 'calendar', action: 'delete', category: 'Calendar' },
  { id: 'perm-022', codename: 'calendar.share', name: 'Compartir Calendario/Eventos', resource: 'calendar', action: 'share', category: 'Calendar' },
  { id: 'perm-023', codename: 'calendar.sync', name: 'Sincronizar con Google/Outlook', resource: 'calendar', action: 'sync', category: 'Calendar' },

  // === Landing Pages (6) ===
  { id: 'perm-024', codename: 'landing.create', name: 'Crear Landing Pages', resource: 'landing', action: 'create', category: 'Landing' },
  { id: 'perm-025', codename: 'landing.read', name: 'Ver Landing Pages', resource: 'landing', action: 'read', category: 'Landing' },
  { id: 'perm-026', codename: 'landing.edit', name: 'Editar Contenido/Secciones', resource: 'landing', action: 'edit', category: 'Landing' },
  { id: 'perm-027', codename: 'landing.publish', name: 'Publicar Cambios en Vivo', resource: 'landing', action: 'publish', category: 'Landing' },
  { id: 'perm-028', codename: 'branding.update', name: 'Modificar Branding (Colores, Logos)', resource: 'branding', action: 'update', category: 'Landing' },
  { id: 'perm-029', codename: 'forms.manage', name: 'Configurar Formularios de Contacto', resource: 'forms', action: 'manage', category: 'Landing' },

  // === Portfolio & Projects (8) ===
  { id: 'perm-030', codename: 'projects.create', name: 'Crear Proyectos', resource: 'projects', action: 'create', category: 'Projects' },
  { id: 'perm-031', codename: 'projects.read', name: 'Ver Proyectos', resource: 'projects', action: 'read', category: 'Projects' },
  { id: 'perm-032', codename: 'projects.update', name: 'Editar Proyectos', resource: 'projects', action: 'update', category: 'Projects' },
  { id: 'perm-033', codename: 'projects.delete', name: 'Eliminar Proyectos', resource: 'projects', action: 'delete', category: 'Projects' },
  { id: 'perm-034', codename: 'projects.sections', name: 'Gestionar Secciones/Tags', resource: 'projects', action: 'sections', category: 'Projects' },
  { id: 'perm-035', codename: 'credentials.manage', name: 'Crear/Editar Credenciales', resource: 'credentials', action: 'manage', category: 'Projects' },
  { id: 'perm-036', codename: 'credentials.reveal', name: 'Ver Contraseñas Encriptadas', resource: 'credentials', action: 'reveal', category: 'Projects' },
  { id: 'perm-037', codename: 'portfolio.publish', name: 'Publicar Items de Portfolio', resource: 'portfolio', action: 'publish', category: 'Projects' },

  // === Digital Services (5) ===
  { id: 'perm-038', codename: 'digital_services.tarjeta', name: 'Gestionar Tarjeta Digital', resource: 'digital_services', action: 'tarjeta', category: 'Digital Services' },
  { id: 'perm-039', codename: 'digital_services.landing', name: 'Gestionar Landing Pública', resource: 'digital_services', action: 'landing', category: 'Digital Services' },
  { id: 'perm-040', codename: 'digital_services.cv', name: 'Gestionar CV Digital', resource: 'digital_services', action: 'cv', category: 'Digital Services' },
  { id: 'perm-041', codename: 'digital_services.portfolio', name: 'Gestionar Portfolio Público', resource: 'digital_services', action: 'portfolio', category: 'Digital Services' },
  { id: 'perm-042', codename: 'public_profiles.analytics', name: 'Ver Analytics de Perfil Público', resource: 'public_profiles', action: 'analytics', category: 'Digital Services' },

  // === Billing & Subscriptions (4) ===
  { id: 'perm-043', codename: 'billing.read', name: 'Ver Facturación', resource: 'billing', action: 'read', category: 'Billing' },
  { id: 'perm-044', codename: 'billing.manage', name: 'Actualizar Métodos de Pago', resource: 'billing', action: 'manage', category: 'Billing' },
  { id: 'perm-045', codename: 'billing.upgrade', name: 'Cambiar Plan de Suscripción', resource: 'billing', action: 'upgrade', category: 'Billing' },
  { id: 'perm-046', codename: 'promotions.manage', name: 'Crear/Editar Códigos Promocionales', resource: 'promotions', action: 'manage', category: 'Billing' },

  // === Analytics (2) ===
  { id: 'perm-047', codename: 'analytics.read', name: 'Ver Dashboards de Analytics', resource: 'analytics', action: 'read', category: 'Analytics' },
  { id: 'perm-048', codename: 'analytics.export', name: 'Exportar Datos de Analytics', resource: 'analytics', action: 'export', category: 'Analytics' },

  // === Settings (2) ===
  { id: 'perm-049', codename: 'settings.read', name: 'Ver Configuración', resource: 'settings', action: 'read', category: 'Settings' },
  { id: 'perm-050', codename: 'settings.update', name: 'Modificar Configuración', resource: 'settings', action: 'update', category: 'Settings' },

  // === Audit (2) ===
  { id: 'perm-051', codename: 'audit.read', name: 'Ver Logs de Auditoría', resource: 'audit', action: 'read', category: 'Audit' },
  { id: 'perm-052', codename: 'audit.export', name: 'Exportar Trails de Auditoría', resource: 'audit', action: 'export', category: 'Audit' },

  // === Dashboard (1) ===
  { id: 'perm-053', codename: 'dashboard.read', name: 'Ver Dashboard', resource: 'dashboard', action: 'read', category: 'Dashboard' },

  // === Customers / Tenants (9) ===
  { id: 'perm-054', codename: 'customers.read', name: 'Ver Clientes', resource: 'customers', action: 'read', category: 'Customers' },
  { id: 'perm-055', codename: 'customers.create', name: 'Crear Clientes', resource: 'customers', action: 'create', category: 'Customers' },
  { id: 'perm-056', codename: 'customers.update', name: 'Editar Clientes', resource: 'customers', action: 'update', category: 'Customers' },
  { id: 'perm-057', codename: 'customers.delete', name: 'Eliminar Clientes', resource: 'customers', action: 'delete', category: 'Customers' },
  { id: 'perm-058', codename: 'customers.suspend', name: 'Suspender Clientes', resource: 'customers', action: 'suspend', category: 'Customers' },
  { id: 'perm-059', codename: 'customers.analytics', name: 'Ver Analytics de Clientes', resource: 'customers', action: 'analytics', category: 'Customers' },
  { id: 'perm-060', codename: 'customers.export', name: 'Exportar Datos de Clientes', resource: 'customers', action: 'export', category: 'Customers' },
  { id: 'perm-061', codename: 'subscriptions.manage', name: 'Gestionar Suscripciones', resource: 'subscriptions', action: 'manage', category: 'Customers' },
  { id: 'perm-062', codename: 'subscriptions.cancel', name: 'Cancelar Suscripciones', resource: 'subscriptions', action: 'cancel', category: 'Customers' },
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

// ===========================
// Promotions / Discounts
// ===========================

export const promotions = [
  {
    id: 'promo-001',
    code: 'SUMMER2026',
    name: 'Promoción de Verano 2026',
    description: 'Descuento especial para nuevos clientes en verano',
    type: 'percentage',
    value: 20,
    maxDiscount: 100,
    applicablePlans: ['plan-starter', 'plan-professional'],
    applicableNewCustomersOnly: true,
    startsAt: '2026-06-01',
    expiresAt: '2026-08-31',
    maxUses: 100,
    currentUses: 23,
    maxUsesPerCustomer: 1,
    status: 'active',
    createdBy: 'user-001',
    createdAt: '2026-05-15',
    lastUsedAt: '2026-07-20 14:30',
    conversionRate: 15.5,
    totalRevenue: 2340.50,
    avgDiscountAmount: 18.75
  },
  {
    id: 'promo-002',
    code: 'STARTUP50',
    name: 'Descuento para Startups',
    description: '$50 de descuento en el primer mes para startups verificadas',
    type: 'fixed_amount',
    value: 50,
    maxDiscount: null,
    applicablePlans: ['plan-professional'],
    applicableNewCustomersOnly: true,
    startsAt: '2026-01-01',
    expiresAt: '2026-12-31',
    maxUses: null,
    currentUses: 87,
    maxUsesPerCustomer: 1,
    status: 'active',
    createdBy: 'user-001',
    createdAt: '2025-12-20',
    lastUsedAt: '2026-07-22 09:15',
    conversionRate: 22.3,
    totalRevenue: 4350.00,
    avgDiscountAmount: 50.00
  },
  {
    id: 'promo-003',
    code: 'TRIAL30',
    name: 'Trial Extendido 30 Días',
    description: '30 días adicionales de trial gratuito',
    type: 'trial_extension',
    value: 30,
    maxDiscount: null,
    applicablePlans: [],
    applicableNewCustomersOnly: true,
    startsAt: '2026-03-01',
    expiresAt: '2026-05-31',
    maxUses: 50,
    currentUses: 50,
    maxUsesPerCustomer: 1,
    status: 'depleted',
    createdBy: 'user-001',
    createdAt: '2026-02-25',
    lastUsedAt: '2026-05-20 16:45',
    conversionRate: 18.0,
    totalRevenue: 0,
    avgDiscountAmount: 0
  },
  {
    id: 'promo-004',
    code: 'BLACKFRIDAY',
    name: 'Black Friday 2025',
    description: '50% de descuento en todos los planes',
    type: 'percentage',
    value: 50,
    maxDiscount: 200,
    applicablePlans: [],
    applicableNewCustomersOnly: false,
    startsAt: '2025-11-29',
    expiresAt: '2025-11-30',
    maxUses: 200,
    currentUses: 156,
    maxUsesPerCustomer: 1,
    status: 'expired',
    createdBy: 'user-001',
    createdAt: '2025-11-15',
    lastUsedAt: '2025-11-30 23:59',
    conversionRate: 42.5,
    totalRevenue: 7800.00,
    avgDiscountAmount: 49.50
  },
  {
    id: 'promo-005',
    code: 'EARLYBIRD',
    name: 'Early Bird Q1',
    description: '15% descuento para renovaciones anticipadas',
    type: 'percentage',
    value: 15,
    maxDiscount: 75,
    applicablePlans: ['plan-professional', 'plan-enterprise'],
    applicableNewCustomersOnly: false,
    startsAt: '2026-01-01',
    expiresAt: '2026-03-31',
    maxUses: null,
    currentUses: 12,
    maxUsesPerCustomer: 1,
    status: 'paused',
    createdBy: 'user-001',
    createdAt: '2025-12-28',
    lastUsedAt: '2026-02-14 11:20',
    conversionRate: 8.3,
    totalRevenue: 1188.00,
    avgDiscountAmount: 14.85
  }
];

// Mapeo de permisos por rol
export const rolePermissions = {
  // === SYSTEM ROLES ===

  // Owner: Acceso completo a TODO
  'Owner': [
    'users.*', 'roles.*', 'tasks.*', 'boards.*', 'calendar.*',
    'landing.*', 'branding.*', 'forms.*', 'projects.*', 'credentials.*',
    'portfolio.*', 'digital_services.*', 'public_profiles.*',
    'customers.*', 'subscriptions.*',
    'billing.*', 'promotions.*', 'analytics.*', 'settings.*', 'audit.*',
    'dashboard.*', 'support.*'
  ],

  // Service Manager: Gestión de equipo + todos los servicios (sin billing completo)
  'Service Manager': [
    'users.read', 'users.update', 'users.invite',
    'roles.read', 'roles.assign',
    'tasks.*', 'boards.admin', 'boards.reorder', 'calendar.*',
    'landing.read', 'landing.edit',
    'projects.read', 'projects.update', 'projects.sections',
    'portfolio.read', 'credentials.reveal',
    'digital_services.tarjeta', 'digital_services.landing', 'digital_services.cv',
    'customers.read', 'customers.analytics',
    'analytics.read', 'audit.read',
    'dashboard.*'
  ],

  // Member: Usuario estándar con acceso básico a servicios
  'Member': [
    'dashboard.*',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.assign',
    'calendar.create', 'calendar.read', 'calendar.update', 'calendar.share',
    'projects.read', 'projects.create', 'projects.update',
    'landing.read',
    'digital_services.tarjeta', 'digital_services.cv',
    'analytics.read'
  ],

  // Viewer: Solo lectura
  'Viewer': [
    'dashboard.read',
    'tasks.read',
    'calendar.read',
    'projects.read',
    'landing.read',
    'analytics.read'
  ],

  // === SERVICE-SPECIFIC ROLES ===

  // Landing Manager: Control total de landing pages y branding
  'Landing Manager': [
    // Permisos específicos de landing
    'landing.*', 'branding.*', 'forms.*',
    'analytics.read', 'analytics.export',
    'digital_services.landing', 'public_profiles.analytics',
    // Permisos base de Member
    'dashboard.*', 'tasks.read', 'calendar.read', 'projects.read'
  ],

  // Portfolio Admin: Gestión completa de proyectos y portfolios
  'Portfolio Admin': [
    // Permisos específicos de portfolio
    'projects.*', 'credentials.*', 'portfolio.*',
    'digital_services.portfolio', 'digital_services.cv',
    'public_profiles.analytics',
    // Permisos base de Member
    'dashboard.*', 'tasks.create', 'tasks.read', 'tasks.update',
    'calendar.create', 'calendar.read', 'calendar.update'
  ],

  // Task Coordinator: Gestión de tareas y calendario
  'Task Coordinator': [
    // Permisos específicos de tasks
    'tasks.*', 'boards.*',
    'calendar.*',
    'projects.read', 'projects.update',
    'analytics.read',
    // Permisos base de Member
    'dashboard.*', 'landing.read', 'digital_services.tarjeta'
  ],

  // Content Editor: Edición de contenido (sin publicar)
  'Content Editor': [
    // Permisos específicos de contenido
    'landing.read', 'landing.edit',
    'digital_services.landing', 'digital_services.cv',
    // Permisos base de Member
    'dashboard.*', 'tasks.read', 'calendar.read', 'projects.read'
  ],

  // === CUSTOMER/BILLING ROLES ===

  // Customer Success Manager: Gestión de clientes, onboarding y retención
  'Customer Success Manager': [
    // Clientes (gestión completa)
    'customers.read', 'customers.create', 'customers.update', 'customers.suspend',
    'customers.analytics', 'customers.export',
    // Suscripciones (read + manage, sin cancelar)
    'subscriptions.manage',
    // Usuarios (solo lectura)
    'users.read',
    // Billing (solo lectura)
    'billing.read',
    // Promociones (read + aplicar)
    'promotions.manage',
    // Analytics
    'analytics.read',
    // Audit (read only)
    'audit.read',
    // Dashboard
    'dashboard.*'
  ],

  // Billing Manager: Gestión de facturación, planes y promociones
  'Billing Manager': [
    // Clientes (solo lectura)
    'customers.read', 'customers.analytics', 'customers.export',
    // Suscripciones (gestión completa)
    'subscriptions.manage', 'subscriptions.cancel',
    // Billing (gestión completa)
    'billing.read', 'billing.manage', 'billing.upgrade',
    // Promociones (gestión completa)
    'promotions.manage',
    // Analytics
    'analytics.read', 'analytics.export',
    // Audit
    'audit.read',
    // Dashboard
    'dashboard.*'
  ],

  // === LEGACY ROLES (Compatibilidad hacia atrás) ===
  'OrgAdmin': [
    'users.*', 'roles.*', 'tasks.*', 'boards.*', 'calendar.*',
    'landing.*', 'branding.*', 'forms.*', 'projects.*', 'credentials.*',
    'portfolio.*', 'digital_services.*', 'public_profiles.*',
    'billing.*', 'promotions.*', 'analytics.*', 'settings.*', 'audit.*',
    'dashboard.*'
  ],
  'Manager': [
    'users.read', 'users.update', 'users.invite',
    'roles.read', 'roles.assign',
    'tasks.*', 'boards.admin', 'calendar.*',
    'landing.read', 'landing.edit',
    'projects.read', 'projects.update',
    'analytics.read', 'audit.read',
    'dashboard.*'
  ],
  'Guest': [
    'dashboard.read',
    'tasks.read',
    'calendar.read',
    'projects.read',
    'landing.read',
    'analytics.read'
  ],
  'Engineering': [
    'projects.*', 'credentials.*', 'portfolio.*',
    'digital_services.portfolio', 'digital_services.cv',
    'dashboard.*', 'tasks.create', 'tasks.read', 'tasks.update',
    'calendar.create', 'calendar.read', 'calendar.update'
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

// ===========================
// Customer Analytics Helpers
// ===========================

// Helper: Calcular uso promedio de recurso
const calculateAvgResourceUsage = (customers, resource) => {
  const validCustomers = customers.filter(c => {
    const limit = c.usage[resource]?.limit;
    return limit !== null && limit !== undefined && limit > 0;
  });

  if (validCustomers.length === 0) return 0;

  const totalPercentage = validCustomers.reduce((sum, c) => {
    const current = c.usage[resource].current || 0;
    const limit = c.usage[resource].limit;
    return sum + (current / limit * 100);
  }, 0);

  return (totalPercentage / validCustomers.length).toFixed(1);
};

// Helper: Calcular health score
const calculateHealthScore = (customers) => {
  if (customers.length === 0) return 0;

  // 40% basado en clientes activos
  const activeCustomers = customers.filter(c => c.subscription.status === 'active').length;
  const activeScore = (activeCustomers / customers.length) * 40;

  // 30% basado en uso bajo de recursos (clientes no cerca del límite)
  const customersUnderLimit = customers.filter(c => {
    const usersUsage = c.usage.users.limit ? (c.usage.users.current / c.usage.users.limit) : 0;
    const storageUsage = c.usage.storage.limit ? (c.usage.storage.current / c.usage.storage.limit) : 0;
    return usersUsage < 0.8 && storageUsage < 0.8;
  }).length;
  const resourceScore = (customersUnderLimit / customers.length) * 30;

  // 30% basado en pagos sanos (no past_due)
  const healthyPayments = customers.filter(c => c.subscription.status !== 'past_due').length;
  const paymentScore = (healthyPayments / customers.length) * 30;

  return Math.round(activeScore + resourceScore + paymentScore);
};

// Helper: Calcular métricas principales
export const calculateMetrics = (customers, planFilter = 'all', statusFilter = 'all') => {
  // Filtrar clientes
  const filtered = customers.filter(c => {
    const matchesPlan = planFilter === 'all' || c.subscription.planId === planFilter;
    const matchesStatus = statusFilter === 'all' || c.subscription.status === statusFilter;
    return matchesPlan && matchesStatus;
  });

  // Total de clientes activos
  const totalActiveCustomers = filtered.filter(c => c.subscription.status === 'active').length;

  // Total MRR
  const totalMRR = filtered.reduce((sum, c) => sum + (c.subscription.mrr || 0), 0);

  // ARPC (Average Revenue Per Customer)
  const arpc = totalActiveCustomers > 0 ? (totalMRR / totalActiveCustomers).toFixed(2) : 0;

  // Health Score
  const healthScore = calculateHealthScore(filtered);

  // Uso promedio de recursos
  const resourceUsage = {
    avgUsersPercentage: calculateAvgResourceUsage(filtered, 'users'),
    avgStoragePercentage: calculateAvgResourceUsage(filtered, 'storage'),
    avgApiCallsPercentage: calculateAvgResourceUsage(filtered, 'apiCalls')
  };

  return {
    totalActiveCustomers,
    totalMRR: totalMRR.toFixed(2),
    arpc,
    healthScore,
    resourceUsage
  };
};

// Helper: Distribución por plan
export const calculatePlanDistribution = (customers) => {
  const distribution = {};

  customers.forEach(c => {
    const plan = c.subscription.planName;
    if (!distribution[plan]) {
      distribution[plan] = {
        plan,
        count: 0,
        mrr: 0
      };
    }
    distribution[plan].count++;
    distribution[plan].mrr += c.subscription.mrr || 0;
  });

  // Convertir a array y calcular porcentajes
  const total = customers.length;
  return Object.values(distribution).map(item => ({
    ...item,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
    mrr: item.mrr.toFixed(2)
  })).sort((a, b) => b.count - a.count);
};

// Helper: Distribución por status
export const calculateStatusDistribution = (customers) => {
  const distribution = {};

  customers.forEach(c => {
    const status = c.subscription.status;
    if (!distribution[status]) {
      distribution[status] = {
        status,
        count: 0
      };
    }
    distribution[status].count++;
  });

  // Convertir a array y calcular porcentajes
  const total = customers.length;
  return Object.values(distribution).map(item => ({
    ...item,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
  })).sort((a, b) => b.count - a.count);
};

// Helper: Top clientes por MRR
export const getTopCustomersByMRR = (customers, limit = 5) => {
  return [...customers]
    .sort((a, b) => (b.subscription.mrr || 0) - (a.subscription.mrr || 0))
    .slice(0, limit);
};

// Helper: Clientes en riesgo
export const getAtRiskCustomers = (customers) => {
  return customers.filter(c => {
    // Pago vencido
    if (c.subscription.status === 'past_due') {
      return true;
    }

    // Uso alto de usuarios (>80%)
    if (c.usage.users.limit && (c.usage.users.current / c.usage.users.limit) > 0.8) {
      return true;
    }

    // Uso alto de storage (>80%)
    if (c.usage.storage.limit && (c.usage.storage.current / c.usage.storage.limit) > 0.8) {
      return true;
    }

    return false;
  }).map(c => {
    // Determinar el motivo del riesgo
    const reasons = [];
    if (c.subscription.status === 'past_due') {
      reasons.push('Pago vencido');
    }
    if (c.usage.users.limit && (c.usage.users.current / c.usage.users.limit) > 0.8) {
      reasons.push(`Usuarios: ${Math.round((c.usage.users.current / c.usage.users.limit) * 100)}%`);
    }
    if (c.usage.storage.limit && (c.usage.storage.current / c.usage.storage.limit) > 0.8) {
      reasons.push(`Storage: ${Math.round((c.usage.storage.current / c.usage.storage.limit) * 100)}%`);
    }

    return {
      ...c,
      riskReasons: reasons
    };
  });
};

// ===========================
// Promotions Helpers
// ===========================

// Helper: Generar código promocional aleatorio
export const generatePromoCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin O,0,I,1 para evitar confusión
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper: Validar código único
export const isPromoCodeUnique = (code, promotions, excludeId = null) => {
  return !promotions.some(p =>
    p.code.toLowerCase() === code.toLowerCase() && p.id !== excludeId
  );
};

// Helper: Calcular descuento aplicado
export const calculateDiscount = (promotion, planPrice) => {
  switch (promotion.type) {
    case 'percentage':
      const percentDiscount = planPrice * (promotion.value / 100);
      return promotion.maxDiscount
        ? Math.min(percentDiscount, promotion.maxDiscount)
        : percentDiscount;
    case 'fixed_amount':
      return Math.min(promotion.value, planPrice); // No exceder precio
    case 'trial_extension':
      return 0; // No afecta precio, solo trial
    default:
      return 0;
  }
};

// Helper: Verificar si promoción está vigente
export const isPromotionValid = (promotion, customerId = null) => {
  const now = new Date();
  const start = new Date(promotion.startsAt);
  const end = new Date(promotion.expiresAt);

  // Verificar estado
  if (promotion.status !== 'active') return false;

  // Verificar fechas
  if (now < start || now > end) return false;

  // Verificar límite de usos
  if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) return false;

  // Verificar límite por cliente (requeriría lookup de uso del cliente)
  // Por ahora retornamos true, en producción se validaría con backend

  return true;
};

// Helper: Filtrar promociones
export const filterPromotions = (promotions, filters) => {
  return promotions.filter(promo => {
    // Filtro de búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!promo.code.toLowerCase().includes(search) &&
          !promo.name.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Filtro de status
    if (filters.status !== 'all' && promo.status !== filters.status) {
      return false;
    }

    // Filtro de tipo
    if (filters.type !== 'all' && promo.type !== filters.type) {
      return false;
    }

    return true;
  });
};

// ============================================================================
// Settings Mock Data
// ============================================================================

export const userSettings = {
  userId: 'user-001',
  profile: {
    avatar: null,
    firstName: 'John',
    lastName: 'Smith',
    email: 'admin@acme.com'
  },
  lastPasswordChange: '2025-11-15'
};

export const organizationSettings = {
  name: 'Acme Corporation',
  subdomain: 'acme',
  logo: null,
  primaryColor: '#3b82f6',
  brandingEnabled: true
};

export const interfaceSettings = {
  dateFormat: 'DD/MM/YYYY',
  timezone: 'America/Mexico_City',
  sidebarCollapsed: false
};

export const securitySettings = {
  mfaEnabled: true,
  mfaMethod: 'authenticator',
  sessions: [
    {
      id: 'session-001',
      device: 'Chrome on Windows',
      location: 'México, CDMX',
      ipAddress: '192.168.1.100',
      lastActive: '2026-02-15 14:30',
      isCurrent: true
    },
    {
      id: 'session-002',
      device: 'Safari on iPhone',
      location: 'México, CDMX',
      ipAddress: '192.168.1.105',
      lastActive: '2026-02-15 10:15',
      isCurrent: false
    },
    {
      id: 'session-003',
      device: 'Firefox on Ubuntu',
      location: 'México, Guadalajara',
      ipAddress: '10.0.0.45',
      lastActive: '2026-02-14 18:22',
      isCurrent: false
    }
  ],
  lastPasswordChange: '2025-11-15'
};

export const notificationSettings = {
  email: {
    security: true,
    account: true,
    team: false,
    marketing: false
  },
  push: {
    enabled: false,
    browserPermission: 'default'
  },
  frequency: 'instant'
};

export const notifications = [
  {
    id: 'notif-001',
    type: 'security',
    category: 'security',
    title: 'Nuevo inicio de sesión detectado',
    message: 'Inicio de sesión desde IP 192.168.1.45 (Buenos Aires, AR)',
    time: '2026-02-22T10:30:00',
    read: false,
    icon: 'Shield',
  },
  {
    id: 'notif-002',
    type: 'users',
    category: 'users',
    title: 'Rol actualizado',
    message: 'Sarah Johnson fue promovida a Service Manager',
    time: '2026-02-22T09:15:00',
    read: false,
    icon: 'Users',
  },
  {
    id: 'notif-003',
    type: 'billing',
    category: 'billing',
    title: 'Pago procesado',
    message: 'Se procesó correctamente el pago del plan Professional por $99.00',
    time: '2026-02-21T18:00:00',
    read: false,
    icon: 'CreditCard',
  },
  {
    id: 'notif-004',
    type: 'system',
    category: 'system',
    title: 'Rol "HR Access" deprecado',
    message: '2 usuarios aún tienen asignado el rol "HR Access". Migrar antes del 01/03/2026.',
    time: '2026-02-21T12:00:00',
    read: true,
    icon: 'AlertTriangle',
  },
  {
    id: 'notif-005',
    type: 'security',
    category: 'security',
    title: 'MFA deshabilitado',
    message: 'Mike Chen deshabilitó la autenticación de dos factores',
    time: '2026-02-20T16:45:00',
    read: true,
    icon: 'ShieldOff',
  },
  {
    id: 'notif-006',
    type: 'users',
    category: 'users',
    title: 'Nuevo usuario registrado',
    message: 'David Wilson se unió al equipo como Viewer',
    time: '2026-02-20T08:30:00',
    read: false,
    icon: 'UserPlus',
  },
  {
    id: 'notif-007',
    type: 'billing',
    category: 'billing',
    title: 'Próxima factura',
    message: 'Tu próxima factura de $99.00 se generará el 01/03/2026',
    time: '2026-02-19T10:00:00',
    read: true,
    icon: 'FileText',
  },
  {
    id: 'notif-008',
    type: 'system',
    category: 'system',
    title: 'Actualización del sistema',
    message: 'Se aplicaron mejoras de rendimiento al módulo de permisos (v2.4.1)',
    time: '2026-02-19T06:00:00',
    read: true,
    icon: 'Zap',
  },
  {
    id: 'notif-009',
    type: 'security',
    category: 'security',
    title: 'Intento de acceso fallido',
    message: '3 intentos de login fallidos desde IP 203.0.113.42 para admin@acme.com',
    time: '2026-02-18T22:15:00',
    read: false,
    icon: 'Lock',
  },
  {
    id: 'notif-010',
    type: 'users',
    category: 'users',
    title: 'Invitación pendiente',
    message: 'La invitación de anna.gomez@acme.com lleva 48 horas sin aceptar',
    time: '2026-02-18T09:00:00',
    read: true,
    icon: 'Mail',
  },
  {
    id: 'notif-011',
    type: 'roles',
    category: 'roles',
    title: 'Permiso revocado',
    message: 'Se revocó el permiso "billing.manage" del rol Content Editor',
    time: '2026-02-17T14:30:00',
    read: true,
    icon: 'Key',
  },
  {
    id: 'notif-012',
    type: 'system',
    category: 'system',
    title: 'Backup completado',
    message: 'El backup diario de datos se completó exitosamente (12.5 GB)',
    time: '2026-02-17T03:00:00',
    read: true,
    icon: 'Database',
  },
];

export const paymentMethods = [
  {
    id: 'pm-001',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiry: '12/2027',
    holderName: 'John Smith',
    isDefault: true,
  },
  {
    id: 'pm-002',
    type: 'card',
    brand: 'Mastercard',
    last4: '5555',
    expiry: '08/2026',
    holderName: 'John Smith',
    isDefault: false,
  },
  {
    id: 'pm-003',
    type: 'bank',
    brand: 'Bank Transfer',
    last4: '7890',
    bankName: 'Chase Bank',
    holderName: 'Acme Corporation',
    isDefault: false,
  },
];

export const billingTransactions = [
  {
    id: 'txn-001',
    date: '2026-02-01',
    description: 'Plan Professional - Febrero 2026',
    amount: 99.00,
    status: 'paid',
    invoiceId: 'inv-001',
  },
  {
    id: 'txn-002',
    date: '2026-01-01',
    description: 'Plan Professional - Enero 2026',
    amount: 99.00,
    status: 'paid',
    invoiceId: 'inv-002',
  },
  {
    id: 'txn-003',
    date: '2025-12-01',
    description: 'Plan Starter - Diciembre 2025',
    amount: 29.00,
    status: 'paid',
    invoiceId: 'inv-003',
  },
  {
    id: 'txn-004',
    date: '2025-11-01',
    description: 'Plan Starter - Noviembre 2025',
    amount: 29.00,
    status: 'paid',
    invoiceId: null,
  },
  {
    id: 'txn-005',
    date: '2026-03-01',
    description: 'Plan Professional - Marzo 2026',
    amount: 99.00,
    status: 'pending',
    invoiceId: null,
  },
];

export const reportStats = {
  userActivity: {
    activeUsers: 18,
    inactiveUsers: 5,
    newThisMonth: 3,
    churnRate: 2.1,
  },
  roleDistribution: [
    { role: 'Owner', count: 1, percentage: 4.3 },
    { role: 'Service Manager', count: 2, percentage: 8.7 },
    { role: 'Member', count: 8, percentage: 34.8 },
    { role: 'Content Editor', count: 4, percentage: 17.4 },
    { role: 'Viewer', count: 6, percentage: 26.1 },
    { role: 'Portfolio Admin', count: 2, percentage: 8.7 },
  ],
  topPermissions: [
    { permission: 'dashboard.read', usageCount: 23 },
    { permission: 'tasks.read', usageCount: 21 },
    { permission: 'users.read', usageCount: 18 },
    { permission: 'calendar.read', usageCount: 15 },
    { permission: 'projects.read', usageCount: 12 },
  ],
  billingOverview: {
    mrr: 99.00,
    arr: 1188.00,
    avgRevenuePerUser: 4.30,
    trialConversions: 3,
  },
  monthlyGrowth: [
    { month: 'Sep 2025', users: 12, revenue: 29 },
    { month: 'Oct 2025', users: 15, revenue: 29 },
    { month: 'Nov 2025', users: 17, revenue: 29 },
    { month: 'Dic 2025', users: 19, revenue: 29 },
    { month: 'Ene 2026', users: 21, revenue: 99 },
    { month: 'Feb 2026', users: 23, revenue: 99 },
  ],
};

export const supportTickets = [
  // Bandeja (open / in_progress / waiting_client) — 6 tickets
  {
    id: 'TKT-001', subject: 'No puedo acceder al dashboard desde móvil',
    description: 'Desde ayer no puedo ingresar al panel desde mi celular. Error: "Session expired" aunque acabo de iniciar sesión.',
    category: 'technical', priority: 'alta', status: 'open',
    clientId: 'client-001', clientName: 'Tech Solutions S.A.', clientEmail: 'admin@techsolutions.com',
    assignedTo: null, createdAt: '2026-02-22T09:15:00Z', updatedAt: '2026-02-22T09:15:00Z', resolvedAt: null,
    comments: [
      { id: 'c1', author: 'admin@techsolutions.com', role: 'client',
        message: 'El problema empezó después de la actualización del sistema.', createdAt: '2026-02-22T09:20:00Z' }
    ]
  },
  {
    id: 'TKT-002', subject: 'Error al exportar reporte de facturación en PDF',
    description: 'El botón "Exportar PDF" no genera el archivo. El spinner gira indefinidamente.',
    category: 'billing', priority: 'urgente', status: 'in_progress',
    clientId: 'client-002', clientName: 'Innovatech SRL', clientEmail: 'soporte@innovatech.com',
    assignedTo: 'John Admin', createdAt: '2026-02-21T14:00:00Z', updatedAt: '2026-02-22T08:30:00Z', resolvedAt: null,
    comments: [
      { id: 'c2', author: 'soporte@innovatech.com', role: 'client',
        message: 'Necesitamos el reporte para una auditoría que es el viernes.', createdAt: '2026-02-21T14:05:00Z' },
      { id: 'c3', author: 'John Admin', role: 'agent',
        message: 'Estamos investigando el problema. Identificamos un timeout en la generación del PDF para reportes con más de 500 transacciones.', createdAt: '2026-02-22T08:30:00Z' }
    ]
  },
  {
    id: 'TKT-003', subject: 'Solicitud: agregar campo personalizado en perfil de cliente',
    description: 'Necesitamos un campo "Número de contrato interno" en el perfil de cada cliente para vincular con nuestro ERP.',
    category: 'feature_request', priority: 'baja', status: 'open',
    clientId: 'client-003', clientName: 'Global Logistics Corp', clientEmail: 'it@globallogistics.com',
    assignedTo: null, createdAt: '2026-02-20T11:30:00Z', updatedAt: '2026-02-20T11:30:00Z', resolvedAt: null,
    comments: []
  },
  {
    id: 'TKT-004', subject: 'Usuario no puede resetear su contraseña',
    description: 'Mi colega María García no recibe el email de reset de contraseña. Revisamos spam y nada.',
    category: 'access', priority: 'alta', status: 'waiting_client',
    clientId: 'client-004', clientName: 'MedCare Solutions', clientEmail: 'admin@medcare.com',
    assignedTo: 'John Admin', createdAt: '2026-02-19T16:00:00Z', updatedAt: '2026-02-21T10:00:00Z', resolvedAt: null,
    comments: [
      { id: 'c4', author: 'John Admin', role: 'agent',
        message: 'Verificamos el servidor de email. Por favor confirmá que el email registrado para María es maria@medcare.com.', createdAt: '2026-02-21T10:00:00Z' }
    ]
  },
  {
    id: 'TKT-005', subject: 'Plan no actualizó permisos después de upgrade',
    description: 'Hicimos upgrade a Professional ayer pero los nuevos módulos siguen bloqueados.',
    category: 'billing', priority: 'alta', status: 'in_progress',
    clientId: 'client-005', clientName: 'StartupHub Inc', clientEmail: 'ceo@startuphub.com',
    assignedTo: 'John Admin', createdAt: '2026-02-22T07:00:00Z', updatedAt: '2026-02-22T09:45:00Z', resolvedAt: null,
    comments: [
      { id: 'c5', author: 'ceo@startuphub.com', role: 'client',
        message: 'El cobro ya se procesó según nuestro banco.', createdAt: '2026-02-22T07:10:00Z' },
      { id: 'c6', author: 'John Admin', role: 'agent',
        message: 'Confirmado, vemos el pago en el sistema. Hay un delay en la propagación de permisos. Activando manualmente.', createdAt: '2026-02-22T09:45:00Z' }
    ]
  },
  {
    id: 'TKT-006', subject: 'Integración API devuelve 401 desde ayer',
    description: 'Nuestra integración con la API empezó a fallar con error 401 Unauthorized. El token API no cambió.',
    category: 'technical', priority: 'urgente', status: 'open',
    clientId: 'client-001', clientName: 'Tech Solutions S.A.', clientEmail: 'dev@techsolutions.com',
    assignedTo: null, createdAt: '2026-02-22T11:00:00Z', updatedAt: '2026-02-22T11:00:00Z', resolvedAt: null,
    comments: []
  },
  // Historial (resolved / closed) — 4 tickets
  {
    id: 'TKT-007', subject: 'Error al cargar imagen de perfil mayor a 5MB',
    description: 'No puedo subir fotos de perfil mayores a 5MB. Solo aparece un error genérico.',
    category: 'technical', priority: 'media', status: 'resolved',
    clientId: 'client-002', clientName: 'Innovatech SRL', clientEmail: 'design@innovatech.com',
    assignedTo: 'John Admin', createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-16T14:00:00Z',
    resolvedAt: '2026-02-16T14:00:00Z',
    comments: [
      { id: 'c7', author: 'John Admin', role: 'agent',
        message: 'Corregido. El límite era de 5MB para el plan Starter. Con el upgrade a Professional ahora acepta hasta 500MB.', createdAt: '2026-02-16T14:00:00Z' }
    ]
  },
  {
    id: 'TKT-008', subject: 'Facturas no muestran el número de IVA de la empresa',
    description: 'Necesitamos que nuestro CUIT/NIF aparezca en las facturas para poder deducirlas.',
    category: 'billing', priority: 'media', status: 'resolved',
    clientId: 'client-003', clientName: 'Global Logistics Corp', clientEmail: 'contabilidad@globallogistics.com',
    assignedTo: 'John Admin', createdAt: '2026-02-10T09:00:00Z', updatedAt: '2026-02-11T12:00:00Z',
    resolvedAt: '2026-02-11T12:00:00Z',
    comments: [
      { id: 'c8', author: 'John Admin', role: 'agent',
        message: 'Agregado CUIT en la sección Organización > Configuración Fiscal. Las próximas facturas lo incluirán.', createdAt: '2026-02-11T12:00:00Z' }
    ]
  },
  {
    id: 'TKT-009', subject: 'Solicitud de datos para exportación GDPR',
    description: 'Como parte de nuestro compliance GDPR necesitamos exportar todos los datos del workspace.',
    category: 'other', priority: 'baja', status: 'closed',
    clientId: 'client-004', clientName: 'MedCare Solutions', clientEmail: 'legal@medcare.com',
    assignedTo: 'John Admin', createdAt: '2026-02-05T15:00:00Z', updatedAt: '2026-02-07T10:00:00Z',
    resolvedAt: '2026-02-07T10:00:00Z',
    comments: [
      { id: 'c9', author: 'John Admin', role: 'agent',
        message: 'Exportación GDPR completada y enviada al email registrado. Archivo disponible por 48h.', createdAt: '2026-02-07T10:00:00Z' }
    ]
  },
  {
    id: 'TKT-010', subject: 'Notificaciones duplicadas en el dashboard',
    description: 'Cada notificación aparece dos veces en el panel. Ocurre con Chrome y Firefox.',
    category: 'technical', priority: 'media', status: 'resolved',
    clientId: 'client-005', clientName: 'StartupHub Inc', clientEmail: 'admin@startuphub.com',
    assignedTo: 'John Admin', createdAt: '2026-02-01T13:00:00Z', updatedAt: '2026-02-03T09:00:00Z',
    resolvedAt: '2026-02-03T09:00:00Z',
    comments: [
      { id: 'c10', author: 'John Admin', role: 'agent',
        message: 'Bug corregido en la versión 1.3.2. Por favor refresca la página y confirma.', createdAt: '2026-02-03T09:00:00Z' }
    ]
  },
];
