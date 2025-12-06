import { Minus, Plus, Trash2, ShoppingCart, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/contexts/POSContext';
import { useState } from 'react';
import { PaymentModal } from './PaymentModal';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartSubtotal, cartTax, cartTotal } = usePOS();
  const [showPayment, setShowPayment] = useState(false);

  return (
    <>
      <div className="h-full flex flex-col bg-card border-l border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Current Order
            </h2>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Cart is empty</p>
              <p className="text-sm">Add items to start a sale</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div
                  key={item.product.id}
                  className="bg-secondary/50 rounded-xl p-3 animate-scale-in"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        ${item.product.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-mono-numbers font-semibold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-mono-numbers font-bold text-foreground">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono-numbers text-foreground">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-mono-numbers text-foreground">${cartTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="font-mono-numbers text-primary">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="pos"
                size="lg"
                onClick={() => setShowPayment(true)}
                className="flex-col h-auto py-3"
              >
                <Wallet className="w-5 h-5 mb-1" />
                <span className="text-xs">Cash</span>
              </Button>
              <Button
                variant="pos"
                size="lg"
                onClick={() => setShowPayment(true)}
                className="flex-col h-auto py-3"
              >
                <CreditCard className="w-5 h-5 mb-1" />
                <span className="text-xs">Card</span>
              </Button>
              <Button
                variant="pos"
                size="lg"
                onClick={() => setShowPayment(true)}
                className="flex-col h-auto py-3"
              >
                <Smartphone className="w-5 h-5 mb-1" />
                <span className="text-xs">Mobile</span>
              </Button>
            </div>

            <Button
              variant="pos-primary"
              size="xl"
              className="w-full"
              onClick={() => setShowPayment(true)}
            >
              Complete Sale - ${cartTotal.toFixed(2)}
            </Button>
          </div>
        )}
      </div>

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
    </>
  );
};
