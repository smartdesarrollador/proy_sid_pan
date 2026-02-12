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
  const canEditCustomers = () => hasPermission('customers.update');

  // Helper para verificar si es admin completo
  const isOrgAdmin = () => {
    return currentUser?.roles?.includes('OrgAdmin') || false;
  };

  // Helper para obtener el rol principal (primer rol)
  const getPrimaryRole = () => {
    return currentUser?.roles?.[0] || 'Guest';
  };

  // Helper para obtener color del rol
  const getRoleColor = () => {
    const roleColors = {
      'OrgAdmin': '#dc2626',
      'Manager': '#ea580c',
      'Member': '#3b82f6',
      'Guest': '#6b7280',
      'Content Editor': '#8b5cf6',
      'HR Access': '#10b981',
      'Engineering': '#f59e0b'
    };
    return roleColors[getPrimaryRole()] || '#6b7280';
  };

  return {
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
    canEditCustomers,
    isOrgAdmin,
    getPrimaryRole,
    getRoleColor,
    userPermissions
  };
};
