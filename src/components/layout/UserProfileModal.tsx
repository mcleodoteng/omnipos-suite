import { useState, useEffect, useRef } from 'react';
import { X, User, Lock, Mail, Phone, Save, Eye, EyeOff, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePOS } from '@/contexts/POSContext';
import { updateUser, getAllUsers } from '@/lib/database';
import { saveAvatar, getAvatar, deleteAvatar } from '@/lib/avatarStorage';
import { toast } from 'sonner';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ open, onClose }: UserProfileModalProps) => {
  const { currentUser, setCurrentUser } = usePOS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
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
      
      // Load avatar
      if (currentUser.avatarKey) {
        getAvatar(currentUser.avatarKey).then(setAvatarUrl);
      } else {
        setAvatarUrl(null);
      }
    }
  }, [currentUser, open]);

  if (!open || !currentUser) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      const avatarKey = `avatar-${currentUser.id}`;
      
      try {
        await saveAvatar(avatarKey, imageData);
        setAvatarUrl(imageData);
        
        const updatedUser = { ...currentUser, avatarKey };
        await updateUser(updatedUser);
        setCurrentUser(updatedUser);
        
        toast.success('Profile photo updated');
      } catch (error) {
        toast.error('Failed to save profile photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser.avatarKey) return;
    
    try {
      await deleteAvatar(currentUser.avatarKey);
      setAvatarUrl(null);
      
      const updatedUser = { ...currentUser, avatarKey: undefined };
      await updateUser(updatedUser);
      setCurrentUser(updatedUser);
      
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error('Failed to remove profile photo');
    }
  };

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
      const allUsers = await getAllUsers();
      const pinExists = allUsers.some(u => u.pin === pinData.newPin && u.id !== currentUser.id);
      
      if (pinExists) {
        setErrors({ newPin: 'This PIN is already in use' });
        setIsUpdating(false);
        return;
      }

      const updatedUser = { ...currentUser, pin: pinData.newPin };
      
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
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              )}
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
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={currentUser.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-4 border-primary/20">
                      <span className="text-3xl font-bold text-secondary-foreground">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

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
