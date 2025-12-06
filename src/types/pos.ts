export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  image?: string;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  cashReceived?: number;
  change?: number;
  timestamp: Date;
  receiptNumber: string;
  cashier: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'cashier' | 'manager';
  pin: string;
}

export interface DashboardStats {
  todaySales: number;
  totalTransactions: number;
  averageOrder: number;
  topProducts: { name: string; sold: number }[];
  hourlyData: { hour: string; sales: number }[];
}
