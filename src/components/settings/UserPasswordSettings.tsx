import { useState, useEffect } from 'react';
import { Key, User, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext';
import { updateUser, getUserByPin } from '@/lib/database';
import { toast } from 'sonner';

export function UserPasswordSettings() {
  const { currentUser, setCurrentUser } = usePOS();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Clear fields when user changes
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrors([]);
  }, [currentUser?.id]);

  const validatePin = (): boolean => {
    const newErrors: string[] = [];
    
    if (!currentPin) {
      newErrors.push('Current PIN is required');
    } else if (currentPin !== currentUser?.pin) {
      newErrors.push('Current PIN is incorrect');
    }
    
    if (!newPin) {
      newErrors.push('New PIN is required');
    } else if (newPin.length < 4) {
      newErrors.push('PIN must be at least 4 digits');
    } else if (!/^\d+$/.test(newPin)) {
      newErrors.push('PIN must contain only numbers');
    }
    
    if (newPin !== confirmPin) {
      newErrors.push('PINs do not match');
    }
    
    if (newPin === currentPin && currentPin) {
      newErrors.push('New PIN must be different from current PIN');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleUpdatePin = async () => {
    if (!currentUser) return;
    if (!validatePin()) return;
    
    setIsUpdating(true);
    try {
      // Check if new PIN is already used by another user
      const existingUser = await getUserByPin(newPin);
      if (existingUser && existingUser.id !== currentUser.id) {
        setErrors(['This PIN is already in use by another user']);
        return;
      }
      
      const updatedUser = {
        ...currentUser,
        pin: newPin,
      };
      
      await updateUser(updatedUser);
      setCurrentUser(updatedUser);
      
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setErrors([]);
      
      toast.success('PIN updated successfully');
    } catch (error) {
      toast.error('Failed to update PIN');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrors([]);
  };

  if (!currentUser) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm bg-secondary/30 rounded-lg">
        Please log in to manage your PIN.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Info */}
      <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
        <div className="p-2 rounded-full bg-primary/10">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{currentUser.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{currentUser.role}</p>
        </div>
      </div>

      {/* PIN Change Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Current PIN</label>
          <Input
            type="password"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            placeholder="Enter current PIN"
            className="mt-1"
            maxLength={8}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">New PIN</label>
          <Input
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter new PIN (4+ digits)"
            className="mt-1"
            maxLength={8}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Confirm New PIN</label>
          <Input
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Confirm new PIN"
            className="mt-1"
            maxLength={8}
          />
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleResetForm}
          disabled={isUpdating}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          variant="pos-primary"
          className="flex-1"
          onClick={handleUpdatePin}
          disabled={isUpdating || !currentPin || !newPin || !confirmPin}
        >
          {isUpdating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Update PIN
        </Button>
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-secondary/50 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">Security tip:</strong> Use a unique PIN that is at least 
          4 digits long. Avoid common sequences like 1234 or 0000.
        </p>
      </div>
    </div>
  );
}
