import { X, DollarSign, ShoppingBag, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, Transaction } from '@/types/pos';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

type ModalType = 'sales' | 'transactions' | 'average' | 'lowStock';

interface DashboardDetailModalProps {
  open: boolean;
  onClose: () => void;
  type: ModalType;
  transactions: Transaction[];
  lowStockProducts: Product[];
  dateRange: { from: Date; to: Date };
}

export const DashboardDetailModal = ({ 
  open, 
  onClose, 
  type, 
  transactions, 
  lowStockProducts,
  dateRange 
}: DashboardDetailModalProps) => {
  const { formatPrice } = useCurrency();

  if (!open) return null;

  const getTitle = () => {
    switch (type) {
      case 'sales': return "Today's Sales";
      case 'transactions': return 'Transactions';
      case 'average': return 'Average Order Details';
      case 'lowStock': return 'Items Needing Attention';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'sales': return DollarSign;
      case 'transactions': return ShoppingBag;
      case 'average': return TrendingUp;
      case 'lowStock': return AlertTriangle;
    }
  };

  const Icon = getIcon();

  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return txDate >= dateRange.from && txDate <= dateRange.to;
  });

  const renderContent = () => {
    switch (type) {
      case 'sales':
        const totalSales = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
        const cashSales = filteredTransactions.filter(tx => tx.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.total, 0);
        const cardSales = filteredTransactions.filter(tx => tx.paymentMethod === 'card').reduce((sum, tx) => sum + tx.total, 0);
        const mobileSales = filteredTransactions.filter(tx => tx.paymentMethod === 'mobile').reduce((sum, tx) => sum + tx.total, 0);
        
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-3xl font-bold font-mono-numbers text-primary">{formatPrice(totalSales)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-success/10 text-center">
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="font-bold font-mono-numbers text-success">{formatPrice(cashSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-xs text-muted-foreground">Card</p>
                <p className="font-bold font-mono-numbers text-primary">{formatPrice(cardSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                <p className="text-xs text-muted-foreground">Mobile</p>
                <p className="font-bold font-mono-numbers text-purple-400">{formatPrice(mobileSales)}</p>
              </div>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions in this period</p>
            ) : (
              filteredTransactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{tx.receiptNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.items.length} items • {new Date(tx.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-numbers font-semibold text-foreground">{formatPrice(tx.total)}</p>
                    <span className={cn(
                      'text-xs capitalize px-2 py-0.5 rounded-full',
                      tx.paymentMethod === 'cash' ? 'bg-success/10 text-success' :
                      tx.paymentMethod === 'card' ? 'bg-primary/10 text-primary' :
                      'bg-purple-500/10 text-purple-400'
                    )}>
                      {tx.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'average':
        const avgOrder = filteredTransactions.length > 0 
          ? filteredTransactions.reduce((sum, tx) => sum + tx.total, 0) / filteredTransactions.length 
          : 0;
        const minOrder = filteredTransactions.length > 0 
          ? Math.min(...filteredTransactions.map(tx => tx.total)) 
          : 0;
        const maxOrder = filteredTransactions.length > 0 
          ? Math.max(...filteredTransactions.map(tx => tx.total)) 
          : 0;
        const avgItems = filteredTransactions.length > 0 
          ? filteredTransactions.reduce((sum, tx) => sum + tx.items.reduce((s, i) => s + i.quantity, 0), 0) / filteredTransactions.length 
          : 0;
        
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-warning/10">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-3xl font-bold font-mono-numbers text-warning">{formatPrice(avgOrder)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Smallest Order</p>
                <p className="font-bold font-mono-numbers text-foreground">{formatPrice(minOrder)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Largest Order</p>
                <p className="font-bold font-mono-numbers text-foreground">{formatPrice(maxOrder)}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Average Items per Order</p>
              <p className="font-bold font-mono-numbers text-foreground">{avgItems.toFixed(1)} items</p>
            </div>
          </div>
        );

      case 'lowStock':
        return (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-success mb-3" />
                <p className="text-success font-medium">All products are well stocked!</p>
              </div>
            ) : (
              lowStockProducts.map(product => (
                <div 
                  key={product.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    product.stock === 0 
                      ? "bg-destructive/5 border-destructive/20" 
                      : "bg-warning/5 border-warning/20"
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-mono-numbers font-bold",
                      product.stock === 0 ? "text-destructive" : "text-warning"
                    )}>
                      {product.stock} left
                    </p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              type === 'lowStock' ? "bg-warning/10" : "bg-primary/10"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                type === 'lowStock' ? "text-warning" : "text-primary"
              )} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
