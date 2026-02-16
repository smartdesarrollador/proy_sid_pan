import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { hasPermission, canAccess, currentUser, userPermissions } = useAuth();

  // Verificación de permisos específicos
  const canCreateUsers = () => hasPermission('users.create');
  const canEditUsers = () => hasPermission('users.update');
  const canDeleteUsers = () => hasPermission('users.delete');
  const canInviteUsers = () => hasPermission('users.invite');

  const canCreateRoles = () => hasPermission('roles.create');
  const canEditRoles = () => hasPermission('roles.update');
  const canDeleteRoles = () => hasPermission('roles.delete');

  const canManageBilling = () => hasPermission('billing.manage');
  const canUpgradePlan = () => hasPermission('billing.upgrade');

  const canExportAudit = () => hasPermission('audit.export');

  const canUpdateSettings = () => hasPermission('settings.update');

  // Tasks permissions
  const canCreateTasks = () => hasPermission('tasks.create');
  const canEditTasks = () => hasPermission('tasks.update');
  const canDeleteTasks = () => hasPermission('tasks.delete');
  const canAssignTasks = () => hasPermission('tasks.assign');

  // Calendar permissions
  const canCreateEvents = () => hasPermission('calendar.create');
  const canEditEvents = () => hasPermission('calendar.update');
  const canDeleteEvents = () => hasPermission('calendar.delete');
  const canShareCalendar = () => hasPermission('calendar.share');

  // Customers permissions
  const canViewCustomers = () => hasPermission('customers.read');
  const canCreateCustomers = () => hasPermission('customers.create');
  const canEditCustomers = () => hasPermission('customers.update');
  const canDeleteCustomers = () => hasPermission('customers.delete');
  const canSuspendCustomers = () => hasPermission('customers.suspend');
  const canViewCustomerAnalytics = () => hasPermission('customers.analytics');
  const canExportCustomers = () => hasPermission('customers.export');

  // Subscriptions permissions
  const canManageSubscriptions = () => hasPermission('subscriptions.manage');
  const canCancelSubscriptions = () => hasPermission('subscriptions.cancel');

  // Helper para verificar si es admin completo
  const isOrgAdmin = () => {
    return currentUser?.roles?.includes('OrgAdmin') || false;
  };

  // Helper para obtener el rol principal (primer rol)
  const getPrimaryRole = () => {
    return currentUser?.roles?.[0] || 'Guest';
  };

  // === NUEVOS HELPERS DE SERVICIOS WEB ===

  // Landing & Branding
  const canManageLanding = () => hasPermission('landing.edit') || hasPermission('landing.*');
  const canPublishLanding = () => hasPermission('landing.publish');
  const canUpdateBranding = () => hasPermission('branding.update');
  const canManageForms = () => hasPermission('forms.manage');

  // Portfolio & Projects
  const canManageCredentials = () => hasPermission('credentials.manage');
  const canRevealCredentials = () => hasPermission('credentials.reveal');
  const canPublishPortfolio = () => hasPermission('portfolio.publish');
  const canManageProjectSections = () => hasPermission('projects.sections');

  // Tasks & Boards
  const canAdminBoards = () => hasPermission('boards.admin');
  const canReorderBoards = () => hasPermission('boards.reorder');

  // Calendar
  const canSyncCalendar = () => hasPermission('calendar.sync');

  // Digital Services
  const canManageTarjeta = () => hasPermission('digital_services.tarjeta');
  const canManagePublicCV = () => hasPermission('digital_services.cv');
  const canManagePublicPortfolio = () => hasPermission('digital_services.portfolio');

  // Analytics
  const canExportAnalytics = () => hasPermission('analytics.export');

  // Helper para verificar roles actualizados
  const isOwner = () => currentUser?.roles?.includes('Owner') || isOrgAdmin();
  const isServiceManager = () => currentUser?.roles?.includes('Service Manager');
  const isCustomerSuccessManager = () => currentUser?.roles?.includes('Customer Success Manager');
  const isBillingManager = () => currentUser?.roles?.includes('Billing Manager');

  // Helper para obtener color del rol (con nuevos roles + aliases)
  const getRoleColor = () => {
    const roleColors = {
      'Owner': '#dc2626',
      'OrgAdmin': '#dc2626',  // Alias para compatibilidad
      'Service Manager': '#ea580c',
      'Manager': '#ea580c',  // Alias
      'Member': '#3b82f6',
      'Viewer': '#6b7280',
      'Guest': '#6b7280',  // Alias
      'Landing Manager': '#8b5cf6',
      'Portfolio Admin': '#10b981',
      'Task Coordinator': '#f59e0b',
      'Content Editor': '#ec4899',
      'Customer Success Manager': '#06b6d4',  // cyan
      'Billing Manager': '#0ea5e9',  // sky blue
      'Engineering': '#10b981'  // Alias → Portfolio Admin
    };
    return roleColors[getPrimaryRole()] || '#6b7280';
  };

  return {
    // Legacy (mantener)
    hasPermission,
    canAccess,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canInviteUsers,
    canCreateRoles,
    canEditRoles,
    canDeleteRoles,
    canManageBilling,
    canUpgradePlan,
    canExportAudit,
    canUpdateSettings,
    canCreateTasks,
    canEditTasks,
    canDeleteTasks,
    canAssignTasks,
    canCreateEvents,
    canEditEvents,
    canDeleteEvents,
    canShareCalendar,
    canViewCustomers,
    canCreateCustomers,
    canEditCustomers,
    canDeleteCustomers,
    canSuspendCustomers,
    canViewCustomerAnalytics,
    canExportCustomers,
    canManageSubscriptions,
    canCancelSubscriptions,

    // Nuevos helpers de servicios web
    canManageLanding,
    canPublishLanding,
    canUpdateBranding,
    canManageForms,
    canManageCredentials,
    canRevealCredentials,
    canPublishPortfolio,
    canManageProjectSections,
    canAdminBoards,
    canReorderBoards,
    canSyncCalendar,
    canManageTarjeta,
    canManagePublicCV,
    canManagePublicPortfolio,
    canExportAnalytics,
    isOwner,
    isServiceManager,
    isCustomerSuccessManager,
    isBillingManager,

    // Mantener
    isOrgAdmin,
    getPrimaryRole,
    getRoleColor,
    userPermissions
  };
};
