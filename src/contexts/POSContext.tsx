import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Transaction, User } from '@/types/pos';
import { products as initialProducts, users, generateMockTransactions } from '@/data/mockData';

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
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(generateMockTransactions());

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
    setTransactions(prev => [transaction, ...prev]);
    
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

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartTax = cartSubtotal * 0.1;
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
