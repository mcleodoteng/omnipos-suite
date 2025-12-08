import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  Download,
  PieChart
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/contexts/POSContext';
import { useCurrency } from '@/hooks/useCurrency';
import { DateRangePicker, DateRange } from '@/components/shared/DateRangePicker';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)', 'hsl(262, 83%, 58%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export const Reports = () => {
  const { transactions, products } = usePOS();
  const { formatPrice, symbol } = useCurrency();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= dateRange.from && txDate <= dateRange.to;
    });
  }, [transactions, dateRange]);

  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalTransactions = filteredTransactions.length;
    const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = filteredTransactions.reduce((sum, tx) => 
      sum + tx.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    return { totalRevenue, totalTransactions, averageOrder, totalItems };
  }, [filteredTransactions]);

  const dailySalesData = useMemo(() => {
    const salesByDay: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      const day = new Date(tx.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      salesByDay[day] = (salesByDay[day] || 0) + tx.total;
    });
    
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
      day,
      sales: salesByDay[day] || 0,
    }));
  }, [filteredTransactions]);

  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = { cash: 0, card: 0, mobile: 0 };
    filteredTransactions.forEach(tx => {
      methods[tx.paymentMethod] += tx.total;
    });
    
    return [
      { name: 'Cash', value: methods.cash },
      { name: 'Card', value: methods.card },
      { name: 'Mobile', value: methods.mobile },
    ].filter(m => m.value > 0);
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        categories[item.product.category] = (categories[item.product.category] || 0) + (item.product.price * item.quantity);
      });
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { name: item.product.name, quantity: 0, revenue: 0 };
        }
        productSales[item.product.id].quantity += item.quantity;
        productSales[item.product.id].revenue += item.product.price * item.quantity;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredTransactions]);

  const handleExportReport = () => {
    const reportData = {
      dateRange: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
      summary: stats,
      dailySales: dailySalesData,
      paymentMethods: paymentMethodData,
      categoryBreakdown: categoryData,
      topProducts,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales Reports</h1>
            <p className="text-muted-foreground">Analyze your business performance</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button variant="pos-primary" onClick={handleExportReport}>
              <Download className="w-5 h-5 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="pos-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold font-mono-numbers text-foreground">{formatPrice(stats.totalRevenue)}</p>
          </div>
          <div className="pos-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10">
                <ShoppingBag className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Transactions</span>
            </div>
            <p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.totalTransactions}</p>
          </div>
          <div className="pos-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Avg. Order</span>
            </div>
            <p className="text-2xl font-bold font-mono-numbers text-foreground">{formatPrice(stats.averageOrder)}</p>
          </div>
          <div className="pos-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-muted-foreground">Items Sold</span>
            </div>
            <p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.totalItems}</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Sales</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 16%)" />
                  <XAxis dataKey="day" stroke="hsl(215, 16%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 16%, 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(220, 18%, 10%)', 
                      border: '1px solid hsl(220, 16%, 16%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
            <div className="h-72">
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220, 18%, 10%)', 
                        border: '1px solid hsl(220, 16%, 16%)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No data for selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sales by Category</h3>
            <div className="h-72">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 16%)" />
                    <XAxis type="number" stroke="hsl(215, 16%, 55%)" fontSize={12} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(215, 16%, 55%)" 
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(220, 18%, 10%)', 
                        border: '1px solid hsl(220, 16%, 16%)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No data for selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="pos-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-numbers font-bold text-primary">{formatPrice(product.revenue)}</p>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sales data for selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;