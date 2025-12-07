import { Product, Transaction, User, CashDrawer } from '@/types/pos';
import { products as defaultProducts, users as defaultUsers } from '@/data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'swiftpos_products',
  TRANSACTIONS: 'swiftpos_transactions',
  USERS: 'swiftpos_users',
  SETTINGS: 'swiftpos_settings',
  CURRENT_USER: 'swiftpos_current_user',
  CASH_DRAWER: 'swiftpos_cash_drawer',
};

// Products
export const getStoredProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading products from storage:', e);
  }
  saveProducts(defaultProducts);
  return defaultProducts;
};

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to storage:', e);
  }
};

// Transactions
export const getStoredTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (stored) {
      const transactions = JSON.parse(stored);
      return transactions.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
      }));
    }
  } catch (e) {
    console.error('Error loading transactions from storage:', e);
  }
  return [];
};

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions to storage:', e);
  }
};

// Users
export const getStoredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading users from storage:', e);
  }
  saveUsers(defaultUsers);
  return defaultUsers;
};

export const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage:', e);
  }
};

// Current User Session
export const getStoredCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading current user from storage:', e);
  }
  return null;
};

export const saveCurrentUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Error saving current user to storage:', e);
  }
};

// Cash Drawer
export const getStoredCashDrawer = (): CashDrawer | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CASH_DRAWER);
    if (stored) {
      const drawer = JSON.parse(stored);
      return {
        ...drawer,
        openedAt: new Date(drawer.openedAt),
        closedAt: drawer.closedAt ? new Date(drawer.closedAt) : undefined,
      };
    }
  } catch (e) {
    console.error('Error loading cash drawer from storage:', e);
  }
  return null;
};

export const saveCashDrawer = (drawer: CashDrawer | null): void => {
  try {
    if (drawer) {
      localStorage.setItem(STORAGE_KEYS.CASH_DRAWER, JSON.stringify(drawer));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CASH_DRAWER);
    }
  } catch (e) {
    console.error('Error saving cash drawer to storage:', e);
  }
};

// Settings
export interface POSSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  taxName: string;
  receiptWidth: '58' | '80';
  showLogo: boolean;
  autoPrint: boolean;
  showTaxBreakdown: boolean;
  lowStockAlerts: boolean;
  dailySummary: boolean;
  soundEffects: boolean;
  currency: string;
  lowStockThreshold: number;
}

const defaultSettings: POSSettings = {
  storeName: 'SwiftPOS Store',
  storeAddress: '123 Main Street, City, State 12345',
  storePhone: '(555) 123-4567',
  taxRate: 10,
  taxName: 'Sales Tax',
  receiptWidth: '80',
  showLogo: true,
  autoPrint: false,
  showTaxBreakdown: true,
  lowStockAlerts: true,
  dailySummary: true,
  soundEffects: false,
  currency: 'GHS',
  lowStockThreshold: 20,
};

export const getStoredSettings = (): POSSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading settings from storage:', e);
  }
  return defaultSettings;
};

export const saveSettings = (settings: POSSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to storage:', e);
  }
};

// Clear all data (for reset)
export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Export data for backup
export const exportAllData = (): string => {
  const data = {
    products: getStoredProducts(),
    transactions: getStoredTransactions(),
    users: getStoredUsers(),
    settings: getStoredSettings(),
    cashDrawer: getStoredCashDrawer(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

// Import data from backup
export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.products) saveProducts(data.products);
    if (data.transactions) {
      const transactions = data.transactions.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
      }));
      saveTransactions(transactions);
    }
    if (data.users) saveUsers(data.users);
    if (data.settings) saveSettings(data.settings);
    if (data.cashDrawer) saveCashDrawer(data.cashDrawer);
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
};
