import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { History, Monitor, Smartphone, Tablet, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLoginHistory, LoginRecord } from '@/lib/database';

interface LoginHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

function parseUserAgent(ua?: string): { type: 'desktop' | 'mobile' | 'tablet'; browser: string } {
  if (!ua) return { type: 'desktop', browser: 'Unknown' };
  
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  return {
    type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    browser,
  };
}

export const LoginHistoryModal = ({ open, onClose }: LoginHistoryModalProps) => {
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const records = await getLoginHistory(100);
      setHistory(records);
    } catch (error) {
      console.error('Failed to load login history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  if (!open) return null;

  const DeviceIcon = ({ type }: { type: 'desktop' | 'mobile' | 'tablet' }) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Login History</h2>
              <p className="text-xs text-muted-foreground">{history.length} login records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadHistory} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No login history available
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => {
                const deviceInfo = parseUserAgent(record.userAgent);
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-semibold text-secondary-foreground">
                        {record.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{record.userName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DeviceIcon type={deviceInfo.type} />
                        <span>{deviceInfo.browser}</span>
                        <span>•</span>
                        <span className="capitalize">{deviceInfo.type}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-foreground">{format(record.loginAt, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{format(record.loginAt, 'h:mm a')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
