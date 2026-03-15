import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, ShoppingCart, UserCog, Eye, KeyRound, History } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User } from '@/types/pos';
import { getAllUsers, createUser, updateUser, deleteUser } from '@/lib/database/repositories/userRepository';
import { toast } from 'sonner';
import { UserModal } from '@/components/users/UserModal';
import { ResetPinModal } from '@/components/users/ResetPinModal';
import { LoginHistoryModal } from '@/components/users/LoginHistoryModal';
import { usePOS } from '@/contexts/POSContext';
import { getAvatar } from '@/lib/avatarStorage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const Users = () => {
  const { currentUser } = usePOS();
  const [users, setUsers] = useState<User[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewHistory = isAdmin || isManager;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const loadedUsers = await getAllUsers();
    setUsers(loadedUsers);
    
    // Load avatars for all users
    const avatars: Record<string, string> = {};
    for (const user of loadedUsers) {
      if (user.avatarKey) {
        const avatar = await getAvatar(user.avatarKey);
        if (avatar) avatars[user.id] = avatar;
      }
    }
    setUserAvatars(avatars);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'manager': return UserCog;
      default: return ShoppingCart;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'manager': return 'bg-warning/10 text-warning';
      default: return 'bg-success/10 text-success';
    }
  };

  const handleAddUser = () => { setSelectedUser(null); setModalMode('add'); setShowModal(true); };
  const handleViewUser = (user: User) => { setSelectedUser(user); setModalMode('view'); setShowModal(true); };
  const handleEditUser = (user: User) => { setSelectedUser(user); setModalMode('edit'); setShowModal(true); };
  const handleResetPin = (user: User) => { setSelectedUser(user); setShowResetPinModal(true); };

  const handleSaveUser = async (user: User) => {
    try {
      if (modalMode === 'add') {
        await createUser(user);
        toast.success('User added successfully');
      } else {
        await updateUser(user);
        toast.success('User updated successfully');
      }
      await loadUsers();
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handlePinReset = async (userId: string, newPin: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        await updateUser({ ...user, pin: newPin });
        toast.success('PIN reset successfully');
        await loadUsers();
      }
    } catch (error) {
      toast.error('Failed to reset PIN');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        toast.success('User deleted');
        await loadUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-foreground">User Management</h1><p className="text-muted-foreground">Manage staff accounts and permissions</p></div>
          <div className="flex gap-2">
            {canViewHistory && (
              <Button variant="outline" onClick={() => setShowLoginHistory(true)}>
                <History className="w-5 h-5 mr-2" />
                Login History
              </Button>
            )}
            <Button variant="pos-primary" onClick={handleAddUser}><Plus className="w-5 h-5 mr-2" />Add User</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><UsersIcon className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{users.length}</p><p className="text-sm text-muted-foreground">Total Users</p></div></div></div>
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><ShoppingCart className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'cashier').length}</p><p className="text-sm text-muted-foreground">Cashiers</p></div></div></div>
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Shield className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'admin' || u.role === 'manager').length}</p><p className="text-sm text-muted-foreground">Managers/Admins</p></div></div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => {
            const RoleIcon = getRoleIcon(user.role);
            return (
              <div key={user.id} className="pos-card pos-card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {userAvatars[user.id] ? (
                      <img src={userAvatars[user.id]} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><span className="text-lg font-bold text-foreground">{user.name.charAt(0)}</span></div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize', getRoleColor(user.role))}><RoleIcon className="w-3 h-3" />{user.role}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleViewUser(user)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleEditUser(user)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                    {isAdmin && user.id !== currentUser?.id && (
                      <button onClick={() => handleResetPin(user)} className="p-2 rounded-lg hover:bg-warning/10 text-muted-foreground hover:text-warning transition-colors" title="Reset PIN"><KeyRound className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-t border-border"><span className="text-muted-foreground">User ID</span><span className="font-mono text-foreground">USR-{user.id.padStart(4, '0')}</span></div>
                  <div className="flex justify-between py-2 border-t border-border"><span className="text-muted-foreground">PIN Status</span><span className="text-success">Active</span></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pos-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50"><div className="flex items-center gap-2 mb-3"><div className="p-2 rounded-lg bg-success/10"><ShoppingCart className="w-5 h-5 text-success" /></div><span className="font-semibold text-foreground">Cashier</span></div><ul className="space-y-1 text-sm text-muted-foreground"><li>• Process sales</li><li>• View own transactions</li><li>• Print receipts</li></ul></div>
            <div className="p-4 rounded-xl bg-secondary/50"><div className="flex items-center gap-2 mb-3"><div className="p-2 rounded-lg bg-warning/10"><UserCog className="w-5 h-5 text-warning" /></div><span className="font-semibold text-foreground">Manager</span></div><ul className="space-y-1 text-sm text-muted-foreground"><li>• All cashier permissions</li><li>• View all transactions</li><li>• Manage inventory</li><li>• Access reports</li></ul></div>
            <div className="p-4 rounded-xl bg-secondary/50"><div className="flex items-center gap-2 mb-3"><div className="p-2 rounded-lg bg-primary/10"><Shield className="w-5 h-5 text-primary" /></div><span className="font-semibold text-foreground">Admin</span></div><ul className="space-y-1 text-sm text-muted-foreground"><li>• All manager permissions</li><li>• Manage users</li><li>• System settings</li><li>• Full access</li></ul></div>
          </div>
        </div>
      </div>

      <UserModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveUser} user={selectedUser} mode={modalMode} />
      <ResetPinModal 
        open={showResetPinModal} 
        onClose={() => setShowResetPinModal(false)} 
        onReset={handlePinReset} 
        user={selectedUser} 
      />
      <LoginHistoryModal open={showLoginHistory} onClose={() => setShowLoginHistory(false)} />
    </MainLayout>
  );
};

export default Users;