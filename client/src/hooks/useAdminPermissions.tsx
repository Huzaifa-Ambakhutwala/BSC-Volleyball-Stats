import { useAuth } from './useAuth';

export const useAdminPermissions = () => {
  const auth = useAuth();
  // For now, we'll simulate user object structure until we implement full user management
  const user = auth.isAuthenticated ? { 
    isAdmin: true, 
    accessLevel: auth.username === 'Mehdi' ? 'full' : 'limited' 
  } : null;
  
  const isAdmin = user?.isAdmin || false;
  const hasFullAccess = user?.accessLevel === 'full' || user?.accessLevel === undefined; // Default to full for existing admins
  const hasLimitedAccess = user?.accessLevel === 'limited';
  
  return {
    isAdmin,
    hasFullAccess,
    hasLimitedAccess,
    canEdit: isAdmin && hasFullAccess,
    canDelete: isAdmin && hasFullAccess,
    canManagePasswords: isAdmin && hasFullAccess,
    canViewOnly: isAdmin && hasLimitedAccess
  };
};