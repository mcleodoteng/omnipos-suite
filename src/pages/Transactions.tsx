import { useState, useMemo } from 'react';
import { 
  Search, 
  Receipt,
  Eye,
  Printer,
  Download
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types/pos';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { DateRangePicker, DateRange } from '@/components/shared/DateRangePicker';
import { toast } from 'sonner';

export const Transactions = () => {
  const { transactions } = usePOS();
  const { formatPrice } = useCurrency();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tx.cashier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPayment = paymentFilter === 'all' || tx.paymentMethod === paymentFilter;
      
      const txDate = new Date(tx.timestamp);
      const matchesDate = txDate >= dateRange.from && txDate <= dateRange.to;
      
      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [transactions, searchQuery, paymentFilter, dateRange]);

  const stats = useMemo(() => ({
    total: filteredTransactions.reduce((sum, tx) => sum + tx.total, 0),
    count: filteredTransactions.length,
    cash: filteredTransactions.filter(tx => tx.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.total, 0),
    card: filteredTransactions.filter(tx => tx.paymentMethod === 'card').reduce((sum, tx) => sum + tx.total, 0),
    mobile: filteredTransactions.filter(tx => tx.paymentMethod === 'mobile').reduce((sum, tx) => sum + tx.total, 0),
  }), [filteredTransactions]);

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(tx => ({
      receiptNumber: tx.receiptNumber,
      date: new Date(tx.timestamp).toLocaleDateString(),
      time: new Date(tx.timestamp).toLocaleTimeString(),
      cashier: tx.cashier,
      items: tx.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      })),
      subtotal: tx.subtotal,
      tax: tx.tax,
      discount: tx.discount,
      total: tx.total,
      paymentMethod: tx.paymentMethod,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully!');
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground">View and manage all transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="pos-card col-span-2 md:col-span-1">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold font-mono-numbers text-primary">{formatPrice(stats.total)}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.count}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Cash</p>
            <p className="text-xl font-bold font-mono-numbers text-success">{formatPrice(stats.cash)}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Card</p>
            <p className="text-xl font-bold font-mono-numbers text-primary">{formatPrice(stats.card)}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Mobile</p>
            <p className="text-xl font-bold font-mono-numbers text-purple-400">{formatPrice(stats.mobile)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by receipt number or cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'cash', 'card', 'mobile'].map(filter => (
              <button
                key={filter}
                onClick={() => setPaymentFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200',
                  paymentFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="pos-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Receipt #</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Date & Time</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Cashier</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Items</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Payment</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-foreground">{tx.receiptNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-foreground">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-foreground">{tx.cashier}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                        {tx.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium capitalize',
                        tx.paymentMethod === 'cash' 
                          ? 'bg-success/10 text-success'
                          : tx.paymentMethod === 'card'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-purple-500/10 text-purple-400'
                      )}>
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono-numbers font-bold text-foreground">
                      {formatPrice(tx.total)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReceipt(tx)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewReceipt(tx)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your search, filters, or date range</p>
            </div>
          )}
        </div>
      </div>

      {selectedTransaction && (
        <ReceiptModal
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </MainLayout>
  );
};

export default Transactions;