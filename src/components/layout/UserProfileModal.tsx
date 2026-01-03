import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePOS } from '@/contexts/POSContext';
import { updateUser, getAllUsers } from '@/lib/database';
import { toast } from 'sonner';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ open, onClose }: UserProfileModalProps) => {
  const { currentUser, setCurrentUser } = usePOS();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  
  const [showPins, setShowPins] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser && open) {
      setProfileData({
        name: currentUser.name,
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      setErrors({});
    }
  }, [currentUser, open]);

  if (!open || !currentUser) return null;

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    setIsUpdating(true);
    try {
      const updatedUser = {
        ...currentUser,
        name: profileData.name.trim(),
        email: profileData.email.trim() || undefined,
        phone: profileData.phone.trim() || undefined,
      };
      
      await updateUser(updatedUser);
      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully');
      setErrors({});
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePin = async () => {
    const newErrors: Record<string, string> = {};
    
    if (pinData.currentPin !== currentUser.pin) {
      newErrors.currentPin = 'Current PIN is incorrect';
    }
    
    if (pinData.newPin.length < 4 || pinData.newPin.length > 6) {
      newErrors.newPin = 'PIN must be 4-6 digits';
    } else if (!/^\d+$/.test(pinData.newPin)) {
      newErrors.newPin = 'PIN must contain only numbers';
    }
    
    if (pinData.newPin !== pinData.confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsUpdating(true);
    try {
      // Check if PIN is already used by another user
      const allUsers = await getAllUsers();
      const pinExists = allUsers.some(u => u.pin === pinData.newPin && u.id !== currentUser.id);
      
      if (pinExists) {
        setErrors({ newPin: 'This PIN is already in use' });
        setIsUpdating(false);
        return;
      }

      const updatedUser = {
        ...currentUser,
        pin: pinData.newPin,
      };
      
      await updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      toast.success('PIN updated successfully');
      setErrors({});
    } catch (error) {
      toast.error('Failed to update PIN');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">My Profile</h2>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start px-4 pt-2 bg-transparent">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            <TabsContent value="profile" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Enter your name"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email (optional)
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone (optional)
                </Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={isUpdating}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your PIN is used to log in to the system. Keep it secure and don't share it with others.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-pin">Current PIN</Label>
                <div className="relative">
                  <Input
                    id="current-pin"
                    type={showPins.current ? 'text' : 'password'}
                    value={pinData.currentPin}
                    onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value })}
                    placeholder="Enter current PIN"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPins({ ...showPins, current: !showPins.current })}
                  >
                    {showPins.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.currentPin && <p className="text-xs text-destructive">{errors.currentPin}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN</Label>
                <div className="relative">
                  <Input
                    id="new-pin"
                    type={showPins.new ? 'text' : 'password'}
                    value={pinData.newPin}
                    onChange={(e) => setPinData({ ...pinData, newPin: e.target.value })}
                    placeholder="Enter new PIN (4-6 digits)"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPins({ ...showPins, new: !showPins.new })}
                  >
                    {showPins.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.newPin && <p className="text-xs text-destructive">{errors.newPin}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm New PIN</Label>
                <div className="relative">
                  <Input
                    id="confirm-pin"
                    type={showPins.confirm ? 'text' : 'password'}
                    value={pinData.confirmPin}
                    onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value })}
                    placeholder="Confirm new PIN"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPins({ ...showPins, confirm: !showPins.confirm })}
                  >
                    {showPins.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.confirmPin && <p className="text-xs text-destructive">{errors.confirmPin}</p>}
              </div>

              <Button 
                onClick={handleUpdatePin} 
                disabled={isUpdating || !pinData.currentPin || !pinData.newPin || !pinData.confirmPin}
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Update PIN'}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
