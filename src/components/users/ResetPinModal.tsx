import { useState, useEffect } from 'react';
import { X, KeyRound, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types/pos';

interface ResetPinModalProps {
  open: boolean;
  onClose: () => void;
  onReset: (userId: string, newPin: string) => Promise<void>;
  user: User | null;
}

export const ResetPinModal = ({ open, onClose, onReset, user }: ResetPinModalProps) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNewPin('');
      setConfirmPin('');
      setShowPin(false);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPin.length < 4 || newPin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    try {
      await onReset(user.id, newPin);
      onClose();
    } catch (err) {
      setError('Failed to reset PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <KeyRound className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reset PIN</h2>
              <p className="text-sm text-muted-foreground">For user: {user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
            <p className="font-medium">Admin Action</p>
            <p className="text-xs mt-1">You are resetting the PIN for another user. They will need to use this new PIN to log in.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">New PIN *</label>
            <div className="relative mt-1">
              <Input
                type={showPin ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter new 4-6 digit PIN"
                className="pr-10"
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
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Confirm PIN *</label>
            <div className="relative mt-1">
              <Input
                type={showPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Confirm new PIN"
                className="pr-10"
                maxLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="pos-primary" className="flex-1" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Resetting...' : 'Reset PIN'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};