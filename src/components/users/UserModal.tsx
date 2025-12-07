import { useState, useEffect } from 'react';
import { X, User as UserIcon, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types/pos';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user?: User | null;
  mode: 'add' | 'edit' | 'view';
}

export const UserModal = ({ open, onClose, onSave, user, mode }: UserModalProps) => {
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    role: 'cashier',
    pin: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        name: '',
        role: 'cashier',
        pin: '',
        email: '',
        phone: '',
      });
    }
    setShowPin(false);
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }

    const newUser: User = {
      id: user?.id || Date.now().toString(),
      name: formData.name || '',
      role: formData.role || 'cashier',
      pin: formData.pin || '',
      email: formData.email,
      phone: formData.phone,
      createdAt: user?.createdAt || new Date(),
      lastLogin: user?.lastLogin,
    };

    onSave(newUser);
    onClose();
  };

  if (!open) return null;

  const isViewMode = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {mode === 'add' ? 'Add New User' : mode === 'edit' ? 'Edit User' : 'User Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="mt-1"
              required
              disabled={isViewMode}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              disabled={isViewMode}
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">PIN Code *</label>
            <div className="relative mt-1">
              <Input
                type={showPin ? 'text' : 'password'}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="Enter 4-6 digit PIN"
                className="pr-10"
                required
                disabled={isViewMode}
                maxLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PIN should be 4-6 digits</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              className="mt-1"
              disabled={isViewMode}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone</label>
            <Input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              className="mt-1"
              disabled={isViewMode}
            />
          </div>

          {/* Role Permissions Info */}
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-sm font-medium text-foreground mb-2">Role Permissions</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {formData.role === 'cashier' && (
                <>
                  <li>• Process sales at POS terminal</li>
                  <li>• View own transactions only</li>
                  <li>• Print receipts</li>
                </>
              )}
              {formData.role === 'manager' && (
                <>
                  <li>• All cashier permissions</li>
                  <li>• View all transactions</li>
                  <li>• Manage inventory</li>
                  <li>• Access reports</li>
                </>
              )}
              {formData.role === 'admin' && (
                <>
                  <li>• Full system access</li>
                  <li>• Manage users</li>
                  <li>• System settings</li>
                  <li>• All features unlocked</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="pos-primary" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {mode === 'add' ? 'Add User' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
