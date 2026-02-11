// Feature Gates por Plan de Suscripción
// Define límites y features disponibles por plan

export const featuresByPlan = {
  free: {
    // Tasks
    maxActiveTasks: 10,
    kanbanView: false,
    subtasks: false,
    taskComments: false,
    taskAttachments: false,

    // Calendar
    maxEvents: 20,
    recurringEvents: false,
    calendarIntegrations: false,
    multipleCalendars: false,
    eventReminders: 1,

    // General
    advancedFiltering: false,
    exportData: false,
    customFields: false,
  },

  starter: {
    // Tasks
    maxActiveTasks: 50,
    kanbanView: true,
    subtasks: false,
    taskComments: true,
    taskAttachments: false,

    // Calendar
    maxEvents: 100,
    recurringEvents: false,
    calendarIntegrations: false,
    multipleCalendars: false,
    eventReminders: 3,

    // General
    advancedFiltering: true,
    exportData: false,
    customFields: false,
  },

  professional: {
    // Tasks
    maxActiveTasks: 200,
    kanbanView: true,
    subtasks: true,
    taskComments: true,
    taskAttachments: true,

    // Calendar
    maxEvents: 500,
    recurringEvents: true,
    calendarIntegrations: true,
    multipleCalendars: true,
    eventReminders: 10,

    // General
    advancedFiltering: true,
    exportData: true,
    customFields: true,
  },

  enterprise: {
    // Tasks
    maxActiveTasks: Infinity,
    kanbanView: true,
    subtasks: true,
    taskComments: true,
    taskAttachments: true,

    // Calendar
    maxEvents: Infinity,
    recurringEvents: true,
    calendarIntegrations: true,
    multipleCalendars: true,
    eventReminders: Infinity,

    // General
    advancedFiltering: true,
    exportData: true,
    customFields: true,
  }
};

// Mensajes de upgrade contextuales por feature
export const upgradeMessages = {
  maxActiveTasks: {
    title: 'Límite de tareas alcanzado',
    message: 'Has alcanzado el límite de tareas activas de tu plan actual.',
    feature: 'Tareas ilimitadas',
    requiredPlan: 'professional'
  },
  kanbanView: {
    title: 'Vista Kanban no disponible',
    message: 'La vista Kanban está disponible a partir del plan Starter.',
    feature: 'Vista Kanban',
    requiredPlan: 'starter'
  },
  subtasks: {
    title: 'Subtareas no disponibles',
    message: 'La funcionalidad de subtareas está disponible en el plan Professional.',
    feature: 'Gestión de subtareas',
    requiredPlan: 'professional'
  },
  taskComments: {
    title: 'Comentarios no disponibles',
    message: 'Los comentarios en tareas están disponibles a partir del plan Starter.',
    feature: 'Comentarios en tareas',
    requiredPlan: 'starter'
  },
  taskAttachments: {
    title: 'Archivos adjuntos no disponibles',
    message: 'La funcionalidad de adjuntar archivos está disponible en el plan Professional.',
    feature: 'Archivos adjuntos',
    requiredPlan: 'professional'
  },
  maxEvents: {
    title: 'Límite de eventos alcanzado',
    message: 'Has alcanzado el límite de eventos de tu plan actual.',
    feature: 'Eventos ilimitados',
    requiredPlan: 'professional'
  },
  recurringEvents: {
    title: 'Eventos recurrentes no disponibles',
    message: 'Los eventos recurrentes están disponibles en el plan Professional.',
    feature: 'Eventos recurrentes',
    requiredPlan: 'professional'
  },
  calendarIntegrations: {
    title: 'Integraciones no disponibles',
    message: 'Las integraciones con Google Calendar y Outlook están disponibles en el plan Professional.',
    feature: 'Integraciones de calendario',
    requiredPlan: 'professional'
  },
  multipleCalendars: {
    title: 'Múltiples calendarios no disponibles',
    message: 'La funcionalidad de múltiples calendarios está disponible en el plan Professional.',
    feature: 'Múltiples calendarios',
    requiredPlan: 'professional'
  },
  advancedFiltering: {
    title: 'Filtros avanzados no disponibles',
    message: 'Los filtros avanzados están disponibles a partir del plan Starter.',
    feature: 'Filtros avanzados',
    requiredPlan: 'starter'
  },
  exportData: {
    title: 'Exportación no disponible',
    message: 'La exportación de datos está disponible en el plan Professional.',
    feature: 'Exportación de datos',
    requiredPlan: 'professional'
  },
  customFields: {
    title: 'Campos personalizados no disponibles',
    message: 'Los campos personalizados están disponibles en el plan Professional.',
    feature: 'Campos personalizados',
    requiredPlan: 'professional'
  }
};

// Helper: Mapear plan name a lowercase
export const normalizePlanName = (planName) => {
  if (!planName) return 'free';
  return planName.toLowerCase();
};

// Helper: Obtener nombre display del plan
export const getPlanDisplayName = (planName) => {
  const planNames = {
    free: 'Plan Gratuito',
    starter: 'Plan Starter',
    professional: 'Plan Professional',
    enterprise: 'Plan Enterprise'
  };
  return planNames[normalizePlanName(planName)] || 'Plan Desconocido';
};
