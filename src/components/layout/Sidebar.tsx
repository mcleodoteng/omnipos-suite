import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings, LogOut, Receipt, Users, Wifi, WifiOff, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePOS } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { hasPermission, Permission } from '@/types/pos';
import { UserProfileModal } from './UserProfileModal';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permission: 'dashboard' as Permission },
  { icon: ShoppingCart, label: 'Store', path: '/pos', permission: 'pos' as Permission },
  { icon: Package, label: 'Inventory', path: '/inventory', permission: 'inventory' as Permission },
  { icon: ClipboardList, label: 'Stock Report', path: '/stock-report', permission: 'inventory' as Permission },
  { icon: Receipt, label: 'Transactions', path: '/transactions', permission: 'transactions' as Permission },
  { icon: BarChart3, label: 'Reports', path: '/reports', permission: 'reports' as Permission },
  { icon: Users, label: 'Users', path: '/users', permission: 'users' as Permission },
  { icon: Settings, label: 'Settings', path: '/settings', permission: 'settings' as Permission },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export const Sidebar = ({ mobile, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { currentUser, setCurrentUser, isOffline } = usePOS();
  const userRole = currentUser?.role || 'cashier';
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => { 
    setCurrentUser(null); 
    onNavigate?.();
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.permission === 'transactions' && userRole === 'cashier') {
      return hasPermission(userRole, 'transactions_own');
    }
    return hasPermission(userRole, item.permission);
  });

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border flex flex-col",
      mobile ? "w-full pt-[env(safe-area-inset-top)]" : "fixed left-0 top-0 w-64 z-50"
    )}>
      {!mobile && (
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">SwiftPOS</h1>
              <p className="text-xs text-muted-foreground">Point of Sale</p>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        'mx-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium',
        mobile ? 'mt-4' : 'mt-3',
        isOffline ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'
      )}>
        {isOffline ? (<><WifiOff className="w-4 h-4" />Offline Mode</>) : (<><Wifi className="w-4 h-4" />Online</>)}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200', 
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />{item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-sidebar-border">
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3 mb-3 w-full text-left hover:bg-sidebar-accent rounded-lg p-2 -m-2 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-semibold text-secondary-foreground">{currentUser?.name.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{currentUser?.name || 'Guest'}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser?.role || 'Not logged in'}</p>
          </div>
        </button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />Logout
        </Button>
      </div>

      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </aside>
  );
};
