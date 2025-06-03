import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { unlockMatch, fetchAdminUsersList, verifyAdminCredentials } from '@/lib/firebase';

interface AdminUnlockModalProps {
  matchId: string;
  setNumber?: number;
  onClose: () => void;
  onUnlock: () => void;
}

const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  matchId,
  setNumber,
  onClose,
  onUnlock
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<{ id: number; username: string }[]>([]);

  // Fetch admin users on mount
  useEffect(() => {
    fetchAdminUsersList().then(setAdminUsers).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to load admin users',
        variant: 'destructive',
      });
    });
  }, []);

  useEffect(() => {
    console.log('AdminUnlockModal mounted for match:', matchId);
  }, [matchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      toast({
        title: 'Error',
        description: 'Please enter an admin username.',
        variant: 'destructive',
      });
      return;
    }

    if (!password) {
      toast({
        title: 'Error',
        description: 'Please enter the admin password.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const admin = await verifyAdminCredentials(username, password);
      if (admin) {
        await unlockMatch(matchId, username);
        toast({
          title: 'Success',
          description: 'Match has been unlocked for editing.',
        });
        onUnlock();
        onClose();
        return;
      }
      throw new Error('Invalid admin credentials');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unlock match',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <Lock className="h-5 w-5 mr-2 text-amber-500" />
            Admin Unlock Required
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-600 mb-4">
            This match has been finalized. Admin credentials are required to unlock it for editing.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Username
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select admin</option>
                {adminUsers.map((admin) => (
                  <option key={admin.id} value={admin.username}>{admin.username}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter admin password"
              />
              <p className="mt-1 text-xs text-amber-600">
                Use "0000" as the default admin password
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Match
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUnlockModal;