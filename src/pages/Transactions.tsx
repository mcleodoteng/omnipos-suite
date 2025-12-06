import { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar,
  Receipt,
  Eye,
  Printer,
  Filter,
  Download
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types/pos';
import { ReceiptModal } from '@/components/pos/ReceiptModal';

export const Transactions = () => {
  const { transactions } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tx.cashier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPayment = paymentFilter === 'all' || tx.paymentMethod === paymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [transactions, searchQuery, paymentFilter]);

  const stats = useMemo(() => ({
    total: transactions.reduce((sum, tx) => sum + tx.total, 0),
    count: transactions.length,
    cash: transactions.filter(tx => tx.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.total, 0),
    card: transactions.filter(tx => tx.paymentMethod === 'card').reduce((sum, tx) => sum + tx.total, 0),
    mobile: transactions.filter(tx => tx.paymentMethod === 'mobile').reduce((sum, tx) => sum + tx.total, 0),
  }), [transactions]);

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground">View and manage all transactions</p>
          </div>
          <Button variant="outline">
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="pos-card col-span-2 md:col-span-1">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold font-mono-numbers text-primary">${stats.total.toFixed(2)}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.count}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Cash</p>
            <p className="text-xl font-bold font-mono-numbers text-success">${stats.cash.toFixed(2)}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Card</p>
            <p className="text-xl font-bold font-mono-numbers text-primary">${stats.card.toFixed(2)}</p>
          </div>
          <div className="pos-card">
            <p className="text-sm text-muted-foreground mb-1">Mobile</p>
            <p className="text-xl font-bold font-mono-numbers text-purple-400">${stats.mobile.toFixed(2)}</p>
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
                        <p className="text-foreground">{tx.timestamp.toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">{tx.timestamp.toLocaleTimeString()}</p>
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
                      ${tx.total.toFixed(2)}
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
              <p className="text-sm">Try adjusting your search or filters</p>
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
