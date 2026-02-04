export function hasWorkspaceScope(user, scope) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes(scope);
}

export function canAccessAdminPanel(user) {
  return (
    hasWorkspaceScope(user, 'USERS_MANAGE') ||
    hasWorkspaceScope(user, 'PUNISHMENTS_MANAGE') ||
    hasWorkspaceScope(user, 'ACCESS_KEYS_MANAGE') ||
    hasWorkspaceScope(user, 'AUDIT_VIEW')
  );
}

export function canManageKeys(user) {
  return hasWorkspaceScope(user, 'ACCESS_KEYS_MANAGE');
}

export function canManagePunishments(user) {
  return hasWorkspaceScope(user, 'PUNISHMENTS_MANAGE');
}

export function canManagePermissions(user) {
  return hasWorkspaceScope(user, 'USERS_MANAGE');
}
