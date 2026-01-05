import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePOS } from '@/contexts/POSContext';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { toast } from 'sonner';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, setCurrentUser, settings } = usePOS();
  const navigate = useNavigate();

  const handleSessionTimeout = async () => {
    await setCurrentUser(null);
    toast.info('You have been logged out due to inactivity');
    navigate('/');
  };

  const { isWarningVisible, remainingSeconds, extendSession } = useIdleTimeout({
    timeoutMinutes: settings.sessionTimeoutMinutes,
    warningMinutes: 1,
    onTimeout: handleSessionTimeout,
    enabled: settings.sessionTimeoutEnabled && !!currentUser,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Session Timeout Warning Dialog */}
      <SessionTimeoutDialog
        open={isWarningVisible}
        remainingSeconds={remainingSeconds}
        onExtend={extendSession}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-sidebar border-b border-sidebar-border flex items-center px-4 z-40">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mobile onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">SP</span>
          </div>
          <span className="font-bold text-foreground">SwiftPOS</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 pb-[env(safe-area-inset-bottom)]">
        {children}
      </main>
    </div>
  );
};
