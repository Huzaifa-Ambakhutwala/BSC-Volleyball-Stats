import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { getAdminUsers } from '../lib/firebase';

export const useAdminPermissions = () => {
  const auth = useAuth();
  const [userAccessLevel, setUserAccessLevel] = useState<'full' | 'limited'>('limited');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAccessLevel = async () => {
      if (auth.isAuthenticated && auth.username) {
        try {
          const adminUsers = await getAdminUsers();
          const currentUser = adminUsers.find(admin => admin.username === auth.username);
          setUserAccessLevel(currentUser?.accessLevel || 'limited');
        } catch (error) {
          console.error('Error fetching user access level:', error);
          setUserAccessLevel('limited');
        }
      }
      setLoading(false);
    };

    fetchUserAccessLevel();
  }, [auth.isAuthenticated, auth.username]);

  const user = auth.isAuthenticated ? {
    isAdmin: true,
    accessLevel: userAccessLevel
  } : null;

  const isAdmin = user?.isAdmin || false;
  const hasFullAccess = user?.accessLevel === 'full';
  const hasLimitedAccess = user?.accessLevel === 'limited';

  return {
    isAdmin,
    hasFullAccess,
    hasLimitedAccess,
    canEdit: isAdmin && hasFullAccess,
    canDelete: isAdmin && hasFullAccess,
    canManagePasswords: isAdmin && hasFullAccess,
    canViewOnly: isAdmin && hasLimitedAccess,
    loading
  };
};