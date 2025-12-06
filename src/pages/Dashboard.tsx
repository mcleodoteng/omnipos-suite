import { useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { getDashboardStats } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  positive 
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  change: string; 
  positive: boolean;
}) => (
  <div className="pos-card pos-card-hover animate-slide-up">
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
    <p className="text-2xl font-bold font-mono-numbers text-foreground">{value}</p>
  </div>
);

export const Dashboard = () => {
  const { transactions, products } = usePOS();
  
  const stats = useMemo(() => getDashboardStats(transactions), [transactions]);
  
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock < 20).slice(0, 5),
    [products]
  );

  const recentTransactions = useMemo(() => 
    transactions.slice(0, 5),
    [transactions]
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your store overview.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today's Date</p>
            <p className="font-semibold text-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={`$${stats.todaySales.toFixed(2)}`}
            icon={DollarSign}
            change="+12.5%"
            positive={true}
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions.toString()}
            icon={ShoppingBag}
            change="+8.2%"
            positive={true}
          />
          <StatCard
            title="Average Order"
            value={`$${stats.averageOrder.toFixed(2)}`}
            icon={TrendingUp}
            change="+3.1%"
            positive={true}
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockProducts.length.toString()}
            icon={Package}
            change={lowStockProducts.length > 0 ? 'Needs attention' : 'All good'}
            positive={lowStockProducts.length === 0}
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
                      {tx.items.length} items • {tx.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-numbers font-semibold text-foreground">
                      ${tx.total.toFixed(2)}
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
                {lowStockProducts.map(product => (
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
    </MainLayout>
  );
};

export default Dashboard;
