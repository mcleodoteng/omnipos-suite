import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Transaction, User } from '@/types/pos';
import { 
  getStoredProducts, 
  saveProducts, 
  getStoredTransactions, 
  saveTransactions,
  getStoredCurrentUser,
  saveCurrentUser,
  getStoredSettings,
  saveSettings,
  POSSettings
} from '@/lib/storage';

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
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => getStoredCurrentUser());
  const [products, setProductsState] = useState<Product[]>(() => getStoredProducts());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactionsState] = useState<Transaction[]>(() => getStoredTransactions());
  const [settings, setSettingsState] = useState<POSSettings>(() => getStoredSettings());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  // Persist current user
  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    saveCurrentUser(user);
  };

  // Persist products
  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = (action) => {
    setProductsState(prev => {
      const newProducts = typeof action === 'function' ? action(prev) : action;
      saveProducts(newProducts);
      return newProducts;
    });
  };

  // Persist transactions
  const setTransactions = (newTransactions: Transaction[]) => {
    setTransactionsState(newTransactions);
    saveTransactions(newTransactions);
  };

  // Update settings
  const updateSettings = (newSettings: Partial<POSSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  };

  const addToCart = (product: Product) => {
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
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const addTransaction = (transaction: Transaction) => {
    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    
    // Update stock
    transaction.items.forEach(item => {
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === item.product.id
            ? { ...p, stock: Math.max(0, p.stock - item.quantity) }
            : p
        )
      );
    });
  };

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
