import { useState, useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useCurrency } from '@/hooks/useCurrency';
import { DateRangePicker, DateRange } from '@/components/shared/DateRangePicker';
import { DashboardDetailModal } from '@/components/dashboard/DashboardDetailModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  positive,
  onClick 
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  change: string; 
  positive: boolean;
  onClick?: () => void;
}) => (
  <div 
    className="pos-card pos-card-hover animate-slide-up cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-xl bg-primary/10">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${
        positive ? 'text-success' : 'text-destructive'
      }`}>
        {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {change}
      </div>
    </div>
    <p className="text-muted-foreground text-sm mb-1">{title}</p>
    <p className="text-xl md:text-2xl font-bold font-mono-numbers text-foreground">{value}</p>
  </div>
);

export const Dashboard = () => {
  const { transactions, products, settings } = usePOS();
  const { formatPrice, symbol } = useCurrency();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(),
  });
  
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    type: 'sales' | 'transactions' | 'average' | 'lowStock';
  }>({ open: false, type: 'sales' });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= dateRange.from && txDate <= dateRange.to;
    });
  }, [transactions, dateRange]);
  
  const stats = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCount = filteredTransactions.length;
    const averageOrder = totalCount > 0 ? totalSales / totalCount : 0;
    
    // Top products from filtered transactions
    const productSales: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
      });
    });
    
    const topProducts = Object.entries(productSales)
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    
    // Hourly data
    const hourlyData = Array.from({ length: 12 }, (_, i) => {
      const hour = 8 + i;
      const hourSales = filteredTransactions
        .filter(t => new Date(t.timestamp).getHours() === hour)
        .reduce((sum, t) => sum + t.total, 0);
      return { hour: `${hour}:00`, sales: hourSales };
    });

    return {
      totalSales,
      totalCount,
      averageOrder,
      topProducts,
      hourlyData,
    };
  }, [filteredTransactions]);
  
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock < (settings.lowStockThreshold || 20)),
    [products, settings.lowStockThreshold]
  );

  const recentTransactions = useMemo(() => 
    filteredTransactions.slice(0, 5),
    [filteredTransactions]
  );

  const handleStatClick = (type: 'sales' | 'transactions' | 'average' | 'lowStock') => {
    setDetailModal({ open: true, type });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your store overview.</p>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales"
            value={formatPrice(stats.totalSales)}
            icon={DollarSign}
            change="+12.5%"
            positive={true}
            onClick={() => handleStatClick('sales')}
          />
          <StatCard
            title="Transactions"
            value={stats.totalCount.toString()}
            icon={ShoppingBag}
            change="+8.2%"
            positive={true}
            onClick={() => handleStatClick('transactions')}
          />
          <StatCard
            title="Average Order"
            value={formatPrice(stats.averageOrder)}
            icon={TrendingUp}
            change="+3.1%"
            positive={true}
            onClick={() => handleStatClick('average')}
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockProducts.length.toString()}
            icon={Package}
            change={lowStockProducts.length > 0 ? 'Needs attention' : 'All good'}
            positive={lowStockProducts.length === 0}
            onClick={() => handleStatClick('lowStock')}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Hourly Sales</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.hourlyData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 16%)" />
                  <XAxis dataKey="hour" stroke="hsl(215, 16%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 16%, 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220, 18%, 10%)', 
                      border: '1px solid hsl(220, 16%, 16%)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(210, 20%, 98%)' }}
                    formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Sales']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(199, 89%, 48%)" 
                    fill="url(#salesGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Selling Products</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 16%)" />
                  <XAxis type="number" stroke="hsl(215, 16%, 55%)" fontSize={12} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(215, 16%, 55%)" 
                    fontSize={11}
                    width={100}
                    tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220, 18%, 10%)', 
                      border: '1px solid hsl(220, 16%, 16%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="sold" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{tx.receiptNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.items.length} items • {new Date(tx.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-numbers font-semibold text-foreground">
                      {formatPrice(tx.total)}
                    </p>
                    <p className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                      tx.paymentMethod === 'cash' 
                        ? 'bg-success/10 text-success' 
                        : tx.paymentMethod === 'card'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {tx.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <p>No transactions in selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Low Stock Alert</h3>
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-numbers font-bold text-destructive">
                        {product.stock} left
                      </p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardDetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ ...detailModal, open: false })}
        type={detailModal.type}
        transactions={filteredTransactions}
        products={products}
        lowStockThreshold={settings.lowStockThreshold || 20}
      />
    </MainLayout>
  );
};

export default Dashboard;