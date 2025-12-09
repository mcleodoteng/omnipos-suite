import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Lock, User, ArrowRight, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/contexts/POSContext';
import { getStoredUsers } from '@/lib/storage';
import { toast } from 'sonner';
export const Login = () => {
  const [pin, setPin] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    setCurrentUser,
    isOffline
  } = usePOS();
  const users = getStoredUsers();
  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };
  const handleClear = () => {
    setPin('');
  };
  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };
  const handleLogin = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    const user = users.find(u => u.id === selectedUser);
    if (user && user.pin === pin) {
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } else {
      toast.error('Invalid PIN');
      setPin('');
    }
  };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Offline Badge */}
        {isOffline && <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-warning/10 border border-warning/20 rounded-full text-warning text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            Offline Mode - Data stored locally
          </div>}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 shadow-2xl shadow-primary/30 mb-4">
            <ShoppingCart className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SwiftPOS</h1>
          <p className="text-muted-foreground">Enter your PIN to continue</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-6 space-y-6">
          {/* User Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Select User
            </label>
            <div className="grid grid-cols-3 gap-2">
              {users.map(user => <button key={user.id} onClick={() => setSelectedUser(user.id)} className={`p-3 rounded-xl border transition-all duration-200 ${selectedUser === user.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'}`}>
                  <div className="w-10 h-10 rounded-full bg-secondary mx-auto mb-2 flex items-center justify-center">
                    <span className="text-sm font-semibold">{user.name.charAt(0)}</span>
                  </div>
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </button>)}
            </div>
          </div>

          {/* PIN Display */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Enter PIN
            </label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map(i => <div key={i} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${pin.length > i ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'}`}>
                  {pin.length > i ? '•' : ''}
                </div>)}
            </div>
          </div>

          {/* PIN Pad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => <button key={key} onClick={() => {
            if (key === 'C') handleClear();else if (key === '⌫') handleBackspace();else handlePinInput(key);
          }} className={`h-14 rounded-xl font-semibold text-lg transition-all duration-200 active:scale-95 ${key === 'C' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : key === '⌫' ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {key}
              </button>)}
          </div>

          {/* Login Button */}
          <Button variant="pos-primary" size="xl" className="w-full" onClick={handleLogin} disabled={pin.length !== 4 || !selectedUser}>
            Login
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Demo hint */}
          <p className="text-xs text-center text-muted-foreground">
            ​
          </p>
        </div>
      </div>
    </div>;
};
export default Login;