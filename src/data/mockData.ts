import { Product, Category, User, Transaction } from '@/types/pos';

export const categories: Category[] = [
  { id: '1', name: 'All Items', color: 'primary' },
  { id: '2', name: 'Beverages', color: 'blue' },
  { id: '3', name: 'Snacks', color: 'orange' },
  { id: '4', name: 'Electronics', color: 'purple' },
  { id: '5', name: 'Groceries', color: 'green' },
  { id: '6', name: 'Personal Care', color: 'pink' },
];

export const products: Product[] = [
  { id: '1', name: 'Coca-Cola 500ml', price: 2.50, category: 'Beverages', sku: 'BEV001', stock: 48, barcode: '5449000000996' },
  { id: '2', name: 'Pepsi 500ml', price: 2.50, category: 'Beverages', sku: 'BEV002', stock: 36, barcode: '5449000000997' },
  { id: '3', name: 'Orange Juice 1L', price: 4.99, category: 'Beverages', sku: 'BEV003', stock: 24, barcode: '5449000000998' },
  { id: '4', name: 'Mineral Water 1.5L', price: 1.50, category: 'Beverages', sku: 'BEV004', stock: 72, barcode: '5449000000999' },
  { id: '5', name: 'Energy Drink', price: 3.99, category: 'Beverages', sku: 'BEV005', stock: 30, barcode: '5449000001000' },
  { id: '6', name: 'Lay\'s Chips', price: 3.50, category: 'Snacks', sku: 'SNK001', stock: 45, barcode: '5449000001001' },
  { id: '7', name: 'Doritos Nacho', price: 4.25, category: 'Snacks', sku: 'SNK002', stock: 38, barcode: '5449000001002' },
  { id: '8', name: 'Snickers Bar', price: 1.75, category: 'Snacks', sku: 'SNK003', stock: 60, barcode: '5449000001003' },
  { id: '9', name: 'Oreo Cookies', price: 4.50, category: 'Snacks', sku: 'SNK004', stock: 42, barcode: '5449000001004' },
  { id: '10', name: 'Pringles Original', price: 3.99, category: 'Snacks', sku: 'SNK005', stock: 28, barcode: '5449000001005' },
  { id: '11', name: 'USB-C Cable', price: 9.99, category: 'Electronics', sku: 'ELC001', stock: 25, barcode: '5449000001006' },
  { id: '12', name: 'Wireless Earbuds', price: 29.99, category: 'Electronics', sku: 'ELC002', stock: 15, barcode: '5449000001007' },
  { id: '13', name: 'Power Bank 10000mAh', price: 24.99, category: 'Electronics', sku: 'ELC003', stock: 20, barcode: '5449000001008' },
  { id: '14', name: 'Phone Case', price: 12.99, category: 'Electronics', sku: 'ELC004', stock: 35, barcode: '5449000001009' },
  { id: '15', name: 'Screen Protector', price: 7.99, category: 'Electronics', sku: 'ELC005', stock: 50, barcode: '5449000001010' },
  { id: '16', name: 'Bread Loaf', price: 2.99, category: 'Groceries', sku: 'GRC001', stock: 20, barcode: '5449000001011' },
  { id: '17', name: 'Milk 1L', price: 3.49, category: 'Groceries', sku: 'GRC002', stock: 30, barcode: '5449000001012' },
  { id: '18', name: 'Eggs (12 pack)', price: 5.99, category: 'Groceries', sku: 'GRC003', stock: 25, barcode: '5449000001013' },
  { id: '19', name: 'Butter 250g', price: 4.49, category: 'Groceries', sku: 'GRC004', stock: 18, barcode: '5449000001014' },
  { id: '20', name: 'Cheese Block', price: 6.99, category: 'Groceries', sku: 'GRC005', stock: 22, barcode: '5449000001015' },
  { id: '21', name: 'Shampoo 400ml', price: 8.99, category: 'Personal Care', sku: 'PRC001', stock: 28, barcode: '5449000001016' },
  { id: '22', name: 'Toothpaste', price: 4.99, category: 'Personal Care', sku: 'PRC002', stock: 40, barcode: '5449000001017' },
  { id: '23', name: 'Hand Soap', price: 3.49, category: 'Personal Care', sku: 'PRC003', stock: 35, barcode: '5449000001018' },
  { id: '24', name: 'Deodorant', price: 6.99, category: 'Personal Care', sku: 'PRC004', stock: 32, barcode: '5449000001019' },
];

export const users: User[] = [
  { id: '1', name: 'Admin', role: 'admin', pin: '1234' },
  { id: '2', name: 'John Doe', role: 'cashier', pin: '5678' },
  { id: '3', name: 'Jane Smith', role: 'manager', pin: '9012' },
];

export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({ product, quantity });
      subtotal += product.price * quantity;
    }
    
    const tax = subtotal * 0.1;
    const discount = Math.random() > 0.8 ? subtotal * 0.05 : 0;
    const total = subtotal + tax - discount;
    
    transactions.push({
      id: `TXN${String(i + 1).padStart(6, '0')}`,
      items,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)] as 'cash' | 'card' | 'mobile',
      timestamp: new Date(now.getTime() - Math.random() * 86400000 * 7),
      receiptNumber: `RCP${String(1000 + i).padStart(6, '0')}`,
      cashier: users[Math.floor(Math.random() * users.length)].name,
    });
  }
  
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getDashboardStats = (transactions: Transaction[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTransactions = transactions.filter(t => t.timestamp >= today);
  const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  
  const productSales: Record<string, number> = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
    });
  });
  
  const topProducts = Object.entries(productSales)
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
  
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const hourSales = todayTransactions
      .filter(t => t.timestamp.getHours() === hour)
      .reduce((sum, t) => sum + t.total, 0);
    return { hour: `${hour}:00`, sales: hourSales };
  });
  
  return {
    todaySales,
    totalTransactions: todayTransactions.length,
    averageOrder: todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0,
    topProducts,
    hourlyData,
  };
};
