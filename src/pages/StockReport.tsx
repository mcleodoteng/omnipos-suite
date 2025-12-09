import { useState, useMemo } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  ShoppingCart,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Package
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { DateRangePicker, DateRange } from '@/components/shared/DateRangePicker';
import { getStockAdjustments } from '@/lib/stockAdjustments';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const StockReport = () => {
  const { formatPrice } = useCurrency();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const handleDateRangeChange = (range: DateRange) => setDateRange(range);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const adjustments = useMemo(() => {
    const all = getStockAdjustments();
    return all.filter(adj => {
      const date = new Date(adj.adjustedAt);
      const matchesDate = date >= dateRange.from && date <= dateRange.to;
      const matchesType = typeFilter === 'all' || adj.type === typeFilter;
      return matchesDate && matchesType;
    });
  }, [dateRange, typeFilter]);

  const stats = useMemo(() => {
    const added = adjustments.filter(a => a.type === 'add').reduce((sum, a) => sum + a.adjustment, 0);
    const removed = adjustments.filter(a => a.type === 'remove').reduce((sum, a) => sum + Math.abs(a.adjustment), 0);
    const sales = adjustments.filter(a => a.type === 'sale').reduce((sum, a) => sum + Math.abs(a.adjustment), 0);
    const sets = adjustments.filter(a => a.type === 'set').length;
    
    return { added, removed, sales, sets, total: adjustments.length };
  }, [adjustments]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Product', 'Type', 'Previous Stock', 'Adjustment', 'New Stock', 'Reason', 'Adjusted By'].join(','),
      ...adjustments.map(adj => [
        format(new Date(adj.adjustedAt), 'yyyy-MM-dd HH:mm'),
        `"${adj.productName}"`,
        adj.type,
        adj.previousStock,
        adj.adjustment > 0 ? `+${adj.adjustment}` : adj.adjustment,
        adj.newStock,
        `"${adj.reason}"`,
        adj.adjustedBy
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <ArrowUpCircle className="w-4 h-4 text-success" />;
      case 'remove': return <ArrowDownCircle className="w-4 h-4 text-destructive" />;
      case 'sale': return <ShoppingCart className="w-4 h-4 text-primary" />;
      case 'set': return <RefreshCw className="w-4 h-4 text-warning" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'add': return 'Stock Added';
      case 'remove': return 'Stock Removed';
      case 'sale': return 'Sale';
      case 'set': return 'Stock Set';
      default: return type;
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Stock Report</h1>
            <p className="text-muted-foreground">Track all stock adjustments and inventory changes</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="pos-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Added</p>
                <p className="text-xl font-bold text-success font-mono-numbers">+{stats.added}</p>
              </div>
            </div>
          </div>
          <div className="pos-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Removed</p>
                <p className="text-xl font-bold text-destructive font-mono-numbers">-{stats.removed}</p>
              </div>
            </div>
          </div>
          <div className="pos-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sold via Sales</p>
                <p className="text-xl font-bold text-primary font-mono-numbers">{stats.sales}</p>
              </div>
            </div>
          </div>
          <div className="pos-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <RefreshCw className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Adjustments</p>
                <p className="text-xl font-bold text-foreground font-mono-numbers">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Types' },
            { value: 'add', label: 'Added' },
            { value: 'remove', label: 'Removed' },
            { value: 'sale', label: 'Sales' },
            { value: 'set', label: 'Set' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                typeFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Adjustments Table */}
        <div className="pos-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Previous</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Change</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">New Stock</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">By</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No stock adjustments found for the selected period</p>
                    </td>
                  </tr>
                ) : (
                  adjustments.map(adj => (
                    <tr key={adj.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground">
                          {format(new Date(adj.adjustedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(adj.adjustedAt), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{adj.productName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(adj.type)}
                          <span className="text-sm">{getTypeLabel(adj.type)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono-numbers text-muted-foreground">
                        {adj.previousStock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'font-mono-numbers font-bold',
                          adj.adjustment > 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {adj.adjustment > 0 ? `+${adj.adjustment}` : adj.adjustment}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono-numbers font-bold text-foreground">
                        {adj.newStock}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                        {adj.reason}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{adj.adjustedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StockReport;