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

// Mapeo de permisos por rol
export const rolePermissions = {
  'OrgAdmin': [
    'users.*', 'roles.*', 'permissions.*', 'billing.*',
    'audit.*', 'settings.*', 'dashboard.read', 'content.*', 'projects.*'
  ],
  'Manager': [
    'users.read', 'users.update', 'roles.read', 'projects.*', 'audit.read',
    'dashboard.read', 'content.read'
  ],
  'Member': [
    'dashboard.read', 'projects.read', 'projects.create',
    'content.read', 'content.create', 'content.edit_own'
  ],
  'Content Editor': [
    'dashboard.read', 'content.create', 'content.edit_own',
    'content.read', 'content.delete'
  ],
  'Guest': [
    'dashboard.read'
  ],
  'HR Access': [
    'users.read', 'hr.*', 'dashboard.read'
  ],
  'Engineering': [
    'projects.*', 'technical.*', 'content.read', 'dashboard.read'
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
