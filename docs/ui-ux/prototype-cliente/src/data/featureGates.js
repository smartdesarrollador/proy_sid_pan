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

    // Dashboard
    dashboardWidgets: 3,
    customWidgets: false,
    exportReports: false,
    apiAccess: false,
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

    // Dashboard
    dashboardWidgets: 6,
    customWidgets: false,
    exportReports: false,
    apiAccess: false,
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

    // Dashboard
    dashboardWidgets: 12,
    customWidgets: true,
    exportReports: true,
    apiAccess: true,
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

    // Dashboard
    dashboardWidgets: Infinity,
    customWidgets: true,
    exportReports: true,
    apiAccess: true,
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
