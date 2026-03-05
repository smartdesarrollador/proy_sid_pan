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

  // Projects permissions
  const canCreateProjects = () => hasPermission('projects.create');
  const canEditProjects = () => hasPermission('projects.update');
  const canDeleteProjects = () => hasPermission('projects.delete');
  const canViewProjects = () => hasPermission('projects.read');

  // Project role-based permissions
  const getProjectRole = (projectId) => {
    // This would come from project members in real implementation
    // For prototype, we'll assume current user has access based on projects.* permission
    if (hasPermission('projects.*') || isOrgAdmin()) return 'owner';
    if (hasPermission('projects.update')) return 'editor';
    if (hasPermission('projects.read')) return 'viewer';
    return null;
  };

  const canEditProjectItems = (projectId) => {
    const role = getProjectRole(projectId);
    return role && ['owner', 'admin', 'editor'].includes(role);
  };

  const canDeleteProjectItems = (projectId) => {
    const role = getProjectRole(projectId);
    return role && ['owner', 'admin'].includes(role);
  };

  const canManageProjectMembers = (projectId) => {
    const role = getProjectRole(projectId);
    return role && ['owner', 'admin'].includes(role);
  };

  const canRevealPasswords = (projectId) => {
    const role = getProjectRole(projectId);
    return role && ['owner', 'admin', 'editor'].includes(role);
  };

  // Notes permissions
  const canCreateNotes = () => hasPermission('notes.create');
  const canEditNotes = () => hasPermission('notes.update');
  const canDeleteNotes = () => hasPermission('notes.delete');

  // Contacts permissions
  const canCreateContacts = () => hasPermission('contacts.create');
  const canEditContacts = () => hasPermission('contacts.update');
  const canDeleteContacts = () => hasPermission('contacts.delete');

  // Bookmarks permissions
  const canCreateBookmarks = () => hasPermission('bookmarks.create');
  const canEditBookmarks = () => hasPermission('bookmarks.update');
  const canDeleteBookmarks = () => hasPermission('bookmarks.delete');

  // Env Vars permissions
  const canCreateEnvVars = () => hasPermission('envvars.create');
  const canEditEnvVars = () => hasPermission('envvars.update');
  const canDeleteEnvVars = () => hasPermission('envvars.delete');
  const canRevealEnvVars = () => hasPermission('envvars.reveal') || hasPermission('projects.*') || isOrgAdmin();

  // SSH Keys permissions
  const canCreateSSHKeys = () => hasPermission('sshkeys.create');
  const canEditSSHKeys = () => hasPermission('sshkeys.update');
  const canDeleteSSHKeys = () => hasPermission('sshkeys.delete');

  // SSL Certs permissions
  const canCreateSSLCerts = () => hasPermission('sslcerts.create');
  const canEditSSLCerts = () => hasPermission('sslcerts.update');
  const canDeleteSSLCerts = () => hasPermission('sslcerts.delete');

  // Snippets permissions
  const canCreateSnippets = () => hasPermission('snippets.create');
  const canEditSnippets = () => hasPermission('snippets.update');
  const canDeleteSnippets = () => hasPermission('snippets.delete');

  // Forms permissions
  const canCreateForms = () => hasPermission('forms.create');
  const canEditForms = () => hasPermission('forms.update');
  const canDeleteForms = () => hasPermission('forms.delete');

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
    canCreateNotes,
    canEditNotes,
    canDeleteNotes,
    canCreateContacts,
    canEditContacts,
    canDeleteContacts,
    canCreateBookmarks,
    canEditBookmarks,
    canDeleteBookmarks,
    canCreateEnvVars,
    canEditEnvVars,
    canDeleteEnvVars,
    canRevealEnvVars,
    canCreateSSHKeys,
    canEditSSHKeys,
    canDeleteSSHKeys,
    canCreateSSLCerts,
    canEditSSLCerts,
    canDeleteSSLCerts,
    canCreateSnippets,
    canEditSnippets,
    canDeleteSnippets,
    canCreateForms,
    canEditForms,
    canDeleteForms,
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
    canCreateProjects,
    canEditProjects,
    canDeleteProjects,
    canViewProjects,
    getProjectRole,
    canEditProjectItems,
    canDeleteProjectItems,
    canManageProjectMembers,
    canRevealPasswords,
    isOrgAdmin,
    getPrimaryRole,
    getRoleColor,
    userPermissions
  };
};
