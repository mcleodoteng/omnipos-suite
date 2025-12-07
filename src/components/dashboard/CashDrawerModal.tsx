import { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CashDrawer } from '@/types/pos';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface CashDrawerModalProps {
  open: boolean;
  onClose: () => void;
  drawer: CashDrawer | null;
  onOpen: (openingBalance: number) => void;
  onClose_drawer: (actualCash: number, notes?: string) => void;
}

export const CashDrawerModal = ({ open, onClose, drawer, onOpen, onClose_drawer }: CashDrawerModalProps) => {
  const { formatPrice, symbol } = useCurrency();
  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const handleOpenDrawer = () => {
    const balance = parseFloat(openingBalance) || 0;
    onOpen(balance);
    setOpeningBalance('');
    onClose();
  };

  const handleCloseDrawer = () => {
    const cash = parseFloat(actualCash) || 0;
    onClose_drawer(cash, notes);
    setActualCash('');
    setNotes('');
    onClose();
  };

  const isDrawerOpen = drawer?.status === 'open';
  const difference = drawer ? (parseFloat(actualCash) || 0) - drawer.expectedCash : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Cash Drawer Management</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!isDrawerOpen ? (
            /* Open Drawer Form */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Drawer is Closed</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Open the cash drawer to start accepting cash payments
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Opening Balance ({symbol})</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="Enter starting cash amount"
                  className="mt-1"
                />
              </div>

              <Button variant="pos-primary" className="w-full" onClick={handleOpenDrawer}>
                Open Cash Drawer
              </Button>
            </div>
          ) : (
            /* Close Drawer Form */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 text-success mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">Drawer is Open</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opened at {new Date(drawer.openedAt).toLocaleTimeString()} by {drawer.openedBy}
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Opening Balance</p>
                  <p className="font-bold font-mono-numbers text-foreground">{formatPrice(drawer.openingBalance)}</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="text-xs text-muted-foreground">Cash Sales</p>
                  <p className="font-bold font-mono-numbers text-success">{formatPrice(drawer.cashSales)}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Card Sales</p>
                  <p className="font-bold font-mono-numbers text-primary">{formatPrice(drawer.cardSales)}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <p className="text-xs text-muted-foreground">Mobile Sales</p>
                  <p className="font-bold font-mono-numbers text-purple-400">{formatPrice(drawer.mobileSales)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm font-medium text-foreground mb-1">Expected Cash in Drawer</p>
                <p className="text-2xl font-bold font-mono-numbers text-warning">{formatPrice(drawer.expectedCash)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Actual Cash Count ({symbol})</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="Count the cash in drawer"
                  className="mt-1"
                />
              </div>

              {actualCash && (
                <div className={cn(
                  "p-3 rounded-lg",
                  difference === 0 ? "bg-success/10" : difference > 0 ? "bg-primary/10" : "bg-destructive/10"
                )}>
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p className={cn(
                    "font-bold font-mono-numbers",
                    difference === 0 ? "text-success" : difference > 0 ? "text-primary" : "text-destructive"
                  )}>
                    {difference >= 0 ? '+' : ''}{formatPrice(difference)}
                    {difference === 0 && ' (Balanced)'}
                    {difference > 0 && ' (Over)'}
                    {difference < 0 && ' (Short)'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the drawer..."
                  className="mt-1 w-full min-h-[60px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full border-destructive/30 hover:bg-destructive/10 hover:text-destructive" 
                onClick={handleCloseDrawer}
              >
                Close Cash Drawer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
