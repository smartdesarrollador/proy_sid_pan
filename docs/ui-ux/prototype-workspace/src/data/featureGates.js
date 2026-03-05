/**
 * Feature Gates - Límites y permisos por plan de subscripción
 *
 * Define qué features están disponibles en cada tier de subscripción
 */

export const featuresByPlan = {
  free: {
    // Tareas
    maxActiveTasks: 10,
    kanbanView: false,
    taskPriority: false,
    taskAssignment: false,
    taskComments: false,
    taskAttachments: false,

    // Calendario
    maxEvents: 25,
    recurringEvents: false,
    eventCategories: 3,
    eventReminders: false,
    calendarSync: false,

    // Proyectos
    maxProjects: 2,
    maxSectionsPerProject: 3,
    maxItemsTotal: 50,
    projectBatchOperations: false,
    projectSearch: false,
    projectExport: false,
    projectEncryption: true,
    projectItemTypes: ['credential', 'link', 'note'],

    // Sharing & Collaboration
    canShareElements: false,
    maxSharedUsersPerElement: 0,
    shareAccessLevels: [],
    canShareGroups: false,
    canCreateExternalLinks: false,
    canSetExpirationDate: false,
    canDelegateShareRights: false,

    // Dashboard
    dashboardWidgets: 3,
    customWidgets: false,
    exportReports: false,
    apiAccess: false,

    // Notas
    maxNotes: 10,
    notesSharing: false,

    // Contactos
    maxContacts: 25,
    contactsImport: false,

    // Bookmarks
    maxBookmarks: 20,
    bookmarksSharing: false,

    // DevOps - no disponible en free
    envVarsEnabled: false,
    maxEnvVars: 0,
    sshKeysEnabled: false,
    maxSshKeys: 0,
    sslCertsEnabled: false,
    maxSslCerts: 0,

    // Snippets - disponible en free con límite
    snippetsEnabled: true,
    maxSnippets: 10,

    // Formularios
    maxForms: 1,
    maxQuestionsPerForm: 5,
    maxFormResponses: 10,

    // Auditoría
    auditLogEnabled: false,
    auditLogRetentionDays: 0,

    // Reportes
    reportsEnabled: false,
  },

  starter: {
    // Tareas
    maxActiveTasks: 50,
    kanbanView: true,
    taskPriority: true,
    taskAssignment: true,
    taskComments: false,
    taskAttachments: false,

    // Calendario
    maxEvents: 100,
    recurringEvents: true,
    eventCategories: 10,
    eventReminders: true,
    calendarSync: false,

    // Proyectos
    maxProjects: 10,
    maxSectionsPerProject: 10,
    maxItemsTotal: 200,
    projectBatchOperations: false,
    projectSearch: false,
    projectExport: false,
    projectEncryption: true,
    projectItemTypes: ['credential', 'document', 'link', 'note', 'config'],

    // Sharing & Collaboration
    canShareElements: true,
    maxSharedUsersPerElement: 5,
    shareAccessLevels: ['viewer', 'editor'],
    canShareGroups: false,
    canCreateExternalLinks: false,
    canSetExpirationDate: false,
    canDelegateShareRights: false,

    // Dashboard
    dashboardWidgets: 6,
    customWidgets: false,
    exportReports: false,
    apiAccess: false,

    // Notas
    maxNotes: 100,
    notesSharing: false,

    // Contactos
    maxContacts: 100,
    contactsImport: false,

    // Bookmarks
    maxBookmarks: 100,
    bookmarksSharing: false,

    // DevOps - disponible en starter
    envVarsEnabled: true,
    maxEnvVars: 25,
    sshKeysEnabled: true,
    maxSshKeys: 10,
    sslCertsEnabled: true,
    maxSslCerts: 10,

    // Snippets
    snippetsEnabled: true,
    maxSnippets: 100,

    // Formularios
    maxForms: 5,
    maxQuestionsPerForm: 15,
    maxFormResponses: 100,

    // Auditoría
    auditLogEnabled: false,
    auditLogRetentionDays: 0,

    // Reportes
    reportsEnabled: true,
  },

  professional: {
    // Tareas
    maxActiveTasks: 500,
    kanbanView: true,
    taskPriority: true,
    taskAssignment: true,
    taskComments: true,
    taskAttachments: true,

    // Calendario
    maxEvents: 1000,
    recurringEvents: true,
    eventCategories: Infinity,
    eventReminders: true,
    calendarSync: true,

    // Proyectos
    maxProjects: Infinity,
    maxSectionsPerProject: Infinity,
    maxItemsTotal: Infinity,
    projectBatchOperations: true,
    projectSearch: true,
    projectExport: true,
    projectEncryption: true,
    projectItemTypes: ['credential', 'document', 'link', 'note', 'config'],

    // Sharing & Collaboration
    canShareElements: true,
    maxSharedUsersPerElement: 50,
    shareAccessLevels: ['viewer', 'commenter', 'editor', 'admin'],
    canShareGroups: true,
    canCreateExternalLinks: true,
    canSetExpirationDate: true,
    canDelegateShareRights: false,

    // Dashboard
    dashboardWidgets: 12,
    customWidgets: true,
    exportReports: true,
    apiAccess: true,

    // Notas
    maxNotes: 1000,
    notesSharing: true,

    // Contactos
    maxContacts: 1000,
    contactsImport: true,

    // Bookmarks
    maxBookmarks: 1000,
    bookmarksSharing: true,

    // DevOps
    envVarsEnabled: true,
    maxEnvVars: Infinity,
    sshKeysEnabled: true,
    maxSshKeys: Infinity,
    sslCertsEnabled: true,
    maxSslCerts: Infinity,

    // Snippets
    snippetsEnabled: true,
    maxSnippets: Infinity,

    // Formularios
    maxForms: 25,
    maxQuestionsPerForm: 50,
    maxFormResponses: Infinity,

    // Auditoría
    auditLogEnabled: true,
    auditLogRetentionDays: 30,

    // Reportes
    reportsEnabled: true,
  },

  enterprise: {
    // Tareas
    maxActiveTasks: Infinity,
    kanbanView: true,
    taskPriority: true,
    taskAssignment: true,
    taskComments: true,
    taskAttachments: true,

    // Calendario
    maxEvents: Infinity,
    recurringEvents: true,
    eventCategories: Infinity,
    eventReminders: true,
    calendarSync: true,

    // Proyectos
    maxProjects: Infinity,
    maxSectionsPerProject: Infinity,
    maxItemsTotal: Infinity,
    projectBatchOperations: true,
    projectSearch: true,
    projectExport: true,
    projectEncryption: true,
    projectItemTypes: ['credential', 'document', 'link', 'note', 'config'],
    projectWebhooks: true,
    projectApiAccess: true,

    // Sharing & Collaboration
    canShareElements: true,
    maxSharedUsersPerElement: Infinity,
    shareAccessLevels: ['viewer', 'commenter', 'editor', 'admin'],
    canShareGroups: true,
    canCreateExternalLinks: true,
    canSetExpirationDate: true,
    canDelegateShareRights: true,

    // Dashboard
    dashboardWidgets: Infinity,
    customWidgets: true,
    exportReports: true,
    apiAccess: true,

    // Notas
    maxNotes: Infinity,
    notesSharing: true,

    // Contactos
    maxContacts: Infinity,
    contactsImport: true,

    // Bookmarks
    maxBookmarks: Infinity,
    bookmarksSharing: true,

    // DevOps
    envVarsEnabled: true,
    maxEnvVars: Infinity,
    sshKeysEnabled: true,
    maxSshKeys: Infinity,
    sslCertsEnabled: true,
    maxSslCerts: Infinity,

    // Snippets
    snippetsEnabled: true,
    maxSnippets: Infinity,

    // Formularios
    maxForms: Infinity,
    maxQuestionsPerForm: Infinity,
    maxFormResponses: Infinity,

    // Auditoría
    auditLogEnabled: true,
    auditLogRetentionDays: 365,

    // Reportes
    reportsEnabled: true,
  }
};

/**
 * Mensajes de upgrade para features bloqueadas
 */
export const upgradeMessages = {
  kanbanView: {
    title: 'Vista Kanban no disponible',
    message: 'Actualiza a Plan Starter o superior para usar la vista Kanban.',
    feature: 'Vista Kanban',
    requiredPlan: 'starter'
  },

  recurringEvents: {
    title: 'Eventos recurrentes no disponibles',
    message: 'Crea eventos recurrentes con el Plan Starter o superior.',
    feature: 'Eventos recurrentes',
    requiredPlan: 'starter'
  },

  taskPriority: {
    title: 'Prioridades no disponibles',
    message: 'Actualiza a Plan Starter para usar prioridades en tareas.',
    feature: 'Prioridades de tareas',
    requiredPlan: 'starter'
  },

  taskAssignment: {
    title: 'Asignación de tareas no disponible',
    message: 'Asigna tareas a miembros del equipo con el Plan Starter o superior.',
    feature: 'Asignación de tareas',
    requiredPlan: 'starter'
  },

  taskComments: {
    title: 'Comentarios no disponibles',
    message: 'Colabora con comentarios en tareas con el Plan Professional.',
    feature: 'Comentarios en tareas',
    requiredPlan: 'professional'
  },

  taskAttachments: {
    title: 'Adjuntos no disponibles',
    message: 'Adjunta archivos a tus tareas con el Plan Professional.',
    feature: 'Archivos adjuntos',
    requiredPlan: 'professional'
  },

  eventReminders: {
    title: 'Recordatorios no disponibles',
    message: 'Recibe recordatorios de eventos con el Plan Starter o superior.',
    feature: 'Recordatorios',
    requiredPlan: 'starter'
  },

  calendarSync: {
    title: 'Sincronización de calendario no disponible',
    message: 'Sincroniza con Google Calendar y Outlook con el Plan Professional.',
    feature: 'Sincronización de calendario',
    requiredPlan: 'professional'
  },

  customWidgets: {
    title: 'Widgets personalizados no disponibles',
    message: 'Crea widgets personalizados con el Plan Professional.',
    feature: 'Widgets personalizados',
    requiredPlan: 'professional'
  },

  exportReports: {
    title: 'Exportar reportes no disponible',
    message: 'Exporta tus reportes a PDF/Excel con el Plan Professional.',
    feature: 'Exportar reportes',
    requiredPlan: 'professional'
  },

  apiAccess: {
    title: 'Acceso API no disponible',
    message: 'Integra con API REST con el Plan Professional o superior.',
    feature: 'Acceso API',
    requiredPlan: 'professional'
  },

  maxActiveTasks: {
    title: 'Límite de tareas alcanzado',
    message: 'Has alcanzado el límite de tareas activas para tu plan.',
    feature: 'Más tareas activas',
    requiredPlan: 'starter'
  },

  maxEvents: {
    title: 'Límite de eventos alcanzado',
    message: 'Has alcanzado el límite de eventos para tu plan.',
    feature: 'Más eventos',
    requiredPlan: 'starter'
  },

  // Projects
  maxProjects: {
    title: 'Límite de proyectos alcanzado',
    message: 'Has alcanzado el límite de proyectos para tu plan. Actualiza a Plan Starter.',
    feature: 'Más proyectos',
    requiredPlan: 'starter'
  },

  maxSectionsPerProject: {
    title: 'Límite de secciones alcanzado',
    message: 'Has alcanzado el límite de secciones para este proyecto.',
    feature: 'Más secciones por proyecto',
    requiredPlan: 'starter'
  },

  maxItemsTotal: {
    title: 'Límite de items alcanzado',
    message: 'Has alcanzado el límite total de items en tus proyectos.',
    feature: 'Más items en proyectos',
    requiredPlan: 'starter'
  },

  projectBatchOperations: {
    title: 'Operaciones en lote no disponibles',
    message: 'Realiza operaciones en lote con el Plan Professional.',
    feature: 'Operaciones en lote',
    requiredPlan: 'professional'
  },

  projectSearch: {
    title: 'Búsqueda avanzada no disponible',
    message: 'Busca en todos tus proyectos con el Plan Professional.',
    feature: 'Búsqueda avanzada',
    requiredPlan: 'professional'
  },

  projectExport: {
    title: 'Exportar no disponible',
    message: 'Exporta tus proyectos con el Plan Professional.',
    feature: 'Exportar proyectos',
    requiredPlan: 'professional'
  },

  projectItemTypes: {
    title: 'Tipo de item no disponible',
    message: 'Este tipo de item requiere Plan Starter o superior.',
    feature: 'Tipos de items adicionales',
    requiredPlan: 'starter'
  },

  // Sharing & Collaboration
  canShareElements: {
    title: 'Compartir elementos no disponible',
    message: 'Comparte proyectos, tareas y archivos con tu equipo con el Plan Starter o superior.',
    feature: 'Compartir elementos',
    requiredPlan: 'starter'
  },

  maxSharedUsersPerElement: {
    title: 'Límite de usuarios compartidos alcanzado',
    message: 'Has alcanzado el límite de usuarios con los que puedes compartir este elemento.',
    feature: 'Más usuarios compartidos por elemento',
    requiredPlan: 'professional'
  },

  canShareGroups: {
    title: 'Compartir grupos no disponible',
    message: 'Comparte grupos completos con herencia de permisos con el Plan Professional.',
    feature: 'Compartir grupos',
    requiredPlan: 'professional'
  },

  canCreateExternalLinks: {
    title: 'Enlaces externos no disponibles',
    message: 'Crea enlaces de acceso público con el Plan Professional.',
    feature: 'Enlaces de compartición externos',
    requiredPlan: 'professional'
  },

  canSetExpirationDate: {
    title: 'Expiración de shares no disponible',
    message: 'Establece fechas de expiración para comparticiones con el Plan Professional.',
    feature: 'Expiración automática de shares',
    requiredPlan: 'professional'
  },

  canDelegateShareRights: {
    title: 'Delegación de permisos no disponible',
    message: 'Permite a otros usuarios compartir elementos con el Plan Enterprise.',
    feature: 'Delegación de derechos de compartición',
    requiredPlan: 'enterprise'
  }
};

/**
 * Normaliza el nombre del plan a lowercase
 * @param {string} planName - Nombre del plan (cualquier formato)
 * @returns {string} - Nombre normalizado
 */
export const normalizePlanName = (planName) => {
  if (!planName) return 'free';
  return planName.toLowerCase().trim();
};

/**
 * Obtiene el nombre display del plan
 * @param {string} planKey - Key del plan (free, starter, professional, enterprise)
 * @returns {string}
 */
export const getPlanDisplayName = (planKey) => {
  const displayNames = {
    free: 'Plan Gratuito',
    starter: 'Plan Starter',
    professional: 'Plan Professional',
    enterprise: 'Plan Enterprise'
  };
  return displayNames[planKey] || 'Plan Desconocido';
};

/**
 * Compara dos planes y retorna si el primero es superior al segundo
 * @param {string} plan1 - Plan a comparar
 * @param {string} plan2 - Plan base
 * @returns {boolean}
 */
export const isPlanHigherThan = (plan1, plan2) => {
  const planOrder = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3
  };

  const normalizedPlan1 = normalizePlanName(plan1);
  const normalizedPlan2 = normalizePlanName(plan2);

  return planOrder[normalizedPlan1] > planOrder[normalizedPlan2];
};
