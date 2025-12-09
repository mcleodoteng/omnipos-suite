export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  image?: string;
  barcode?: string;
  description?: string;
  costPrice?: number;
  unit?: string;
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
  email?: string;
  phone?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface DashboardStats {
  todaySales: number;
  totalTransactions: number;
  averageOrder: number;
  topProducts: { name: string; sold: number }[];
  hourlyData: { hour: string; sales: number }[];
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: Date;
  type: 'add' | 'remove' | 'set' | 'sale';
}

export interface CashDrawer {
  id: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  openedBy: string;
  closedBy?: string;
  notes?: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedis' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
];

// Role-based permissions
export const ROLE_PERMISSIONS: Record<User['role'], string[]> = {
  cashier: ['pos', 'transactions_own', 'dashboard'],
  manager: ['pos', 'transactions', 'inventory', 'reports', 'dashboard'],
  admin: ['pos', 'transactions', 'inventory', 'reports', 'users', 'settings', 'dashboard'],
};

export type Permission = 
  | 'pos' 
  | 'transactions' 
  | 'transactions_own' 
  | 'inventory' 
  | 'reports' 
  | 'users' 
  | 'settings' 
  | 'dashboard';

export const hasPermission = (role: User['role'], permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (permission === 'transactions_own' && permissions.includes('transactions')) {
    return true;
  }
  return permissions.includes(permission);
};
