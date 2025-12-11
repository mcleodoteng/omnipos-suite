import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, Transaction, User } from '@/types/pos';
import { useDatabase } from './DatabaseContext';
import { 
  getAllProducts, 
  saveAllProducts,
  getAllTransactions,
  createTransaction as dbCreateTransaction,
  getCurrentUser,
  setCurrentUser as dbSetCurrentUser,
  getSettings,
  updateSettings as dbUpdateSettings,
  createStockAdjustment,
  updateProductStock,
  POSSettings
} from '@/lib/database';

interface POSContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  cartTotal: number;
  cartSubtotal: number;
  cartTax: number;
  settings: POSSettings;
  updateSettings: (newSettings: Partial<POSSettings>) => void;
  isOffline: boolean;
  refreshData: () => Promise<void>;
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

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady } = useDatabase();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [products, setProductsState] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [settings, setSettingsState] = useState<POSSettings>(defaultSettings);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Load data from SQLite when database is ready
  useEffect(() => {
    if (!isReady) return;

    const loadData = async () => {
      try {
        const [loadedProducts, loadedTransactions, loadedUser, loadedSettings] = await Promise.all([
          getAllProducts(),
          getAllTransactions(),
          getCurrentUser(),
          getSettings(),
        ]);
        
        setProductsState(loadedProducts);
        setTransactionsState(loadedTransactions);
        setCurrentUserState(loadedUser);
        setSettingsState(loadedSettings);
        
        console.log('Data loaded from SQLite:', {
          products: loadedProducts.length,
          transactions: loadedTransactions.length,
          user: loadedUser?.name,
        });
      } catch (error) {
        console.error('Error loading data from SQLite:', error);
      }
    };

    loadData();
  }, [isReady]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh data from database
  const refreshData = useCallback(async () => {
    if (!isReady) return;
    
    const [loadedProducts, loadedTransactions, loadedSettings] = await Promise.all([
      getAllProducts(),
      getAllTransactions(),
      getSettings(),
    ]);
    
    setProductsState(loadedProducts);
    setTransactionsState(loadedTransactions);
    setSettingsState(loadedSettings);
  }, [isReady]);

  // Set current user
  const setCurrentUser = useCallback(async (user: User | null) => {
    setCurrentUserState(user);
    if (isReady) {
      await dbSetCurrentUser(user);
    }
  }, [isReady]);

  // Set products with persistence
  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = useCallback((action) => {
    setProductsState(prev => {
      const newProducts = typeof action === 'function' ? action(prev) : action;
      if (isReady) {
        saveAllProducts(newProducts).catch(console.error);
      }
      return newProducts;
    });
  }, [isReady]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<POSSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      if (isReady) {
        dbUpdateSettings(newSettings).catch(console.error);
      }
      return updated;
    });
  }, [isReady]);

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    // Add to local state immediately
    setTransactionsState(prev => [transaction, ...prev]);
    
    if (isReady) {
      // Save to SQLite
      await dbCreateTransaction(transaction);
      
      // Update stock and track adjustments
      for (const item of transaction.items) {
        const currentProduct = products.find(p => p.id === item.product.id);
        const previousStock = currentProduct?.stock || item.quantity;
        const newStock = Math.max(0, previousStock - item.quantity);
        
        // Track stock adjustment for sale
        await createStockAdjustment({
          productId: item.product.id,
          productName: item.product.name,
          previousStock,
          newStock,
          adjustment: -item.quantity,
          reason: `Sale - Receipt #${transaction.receiptNumber}`,
          adjustedBy: transaction.cashier,
          type: 'sale',
        });

        // Update product stock in database
        await updateProductStock(item.product.id, newStock);
      }
      
      // Refresh products to get updated stock
      const updatedProducts = await getAllProducts();
      setProductsState(updatedProducts);
    }
  }, [isReady, products]);

  const taxRate = settings.taxRate / 100;
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartTax = cartSubtotal * taxRate;
  const cartTotal = cartSubtotal + cartTax;

  return (
    <POSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        transactions,
        addTransaction,
        cartTotal,
        cartSubtotal,
        cartTax,
        settings,
        updateSettings,
        isOffline,
        refreshData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
