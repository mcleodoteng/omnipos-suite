import { useState } from 'react';
import { X, Wallet, CreditCard, Smartphone, Check, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { usePOS } from '@/contexts/POSContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ReceiptModal } from './ReceiptModal';
import { Transaction } from '@/types/pos';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'mobile';

export const PaymentModal = ({ open, onClose }: PaymentModalProps) => {
  const { cart, cartTotal, cartSubtotal, cartTax, clearCart, addTransaction, currentUser } = usePOS();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const cashAmount = cashReceived || 0;
  const change = cashAmount - cartTotal;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && cashAmount < cartTotal) {
      toast.error('Insufficient cash amount');
      return;
    }

    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const transaction: Transaction = {
      id: `TXN${Date.now()}`,
      items: [...cart],
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: 0,
      total: cartTotal,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashAmount : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
      timestamp: new Date(),
      receiptNumber: `RCP${String(Date.now()).slice(-8)}`,
      cashier: currentUser?.name || 'Unknown',
    };

    addTransaction(transaction);
    setLastTransaction(transaction);
    setProcessing(false);
    setCompleted(true);
    toast.success('Payment successful!');
  };

  const handleClose = () => {
    if (completed) {
      clearCart();
    }
    setCompleted(false);
    setProcessing(false);
    setCashReceived(0);
    setPaymentMethod('cash');
    setLastTransaction(null);
    onClose();
  };

  const handlePrintReceipt = () => {
    if (lastTransaction) {
      setShowReceipt(true);
    }
  };

  if (!open) return null;

  const quickAmounts = [10, 20, 50, 100];

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl w-full max-w-lg animate-scale-in shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">
              {completed ? 'Payment Complete' : 'Complete Payment'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {completed ? (
            /* Success State */
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Check className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Thank You!</h3>
              <p className="text-muted-foreground mb-6">Transaction completed successfully</p>
              
              {paymentMethod === 'cash' && (
                <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Cash Received</span>
                    <span className="font-mono-numbers font-semibold text-foreground">
                      ${cashAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-foreground">Change</span>
                    <span className="font-mono-numbers font-bold text-success">
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  variant="pos-primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleClose}
                >
                  New Sale
                </Button>
              </div>
            </div>
          ) : (
            /* Payment Form */
            <div className="p-6 space-y-6">
              {/* Amount Display */}
              <div className="text-center py-4 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-4xl font-bold font-mono-numbers text-primary">
                  ${cartTotal.toFixed(2)}
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { method: 'cash' as const, icon: Wallet, label: 'Cash' },
                    { method: 'card' as const, icon: CreditCard, label: 'Card' },
                    { method: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
                  ].map(({ method, icon: Icon, label }) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2',
                        paymentMethod === method
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className={cn(
                        'w-6 h-6',
                        paymentMethod === method ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className={cn(
                        'text-sm font-medium',
                        paymentMethod === method ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Input */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Cash Received
                  </label>
                  <NumberInput
                    value={cashReceived}
                    onChange={(value) => setCashReceived(value)}
                    placeholder="0.00"
                    className="h-14 text-2xl font-mono-numbers text-center"
                    allowDecimals={true}
                    min={0}
                  />
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCashReceived(amount)}
                        className="py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCashReceived(Math.ceil(cartTotal))}
                    className="w-full py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                  >
                    Exact Amount (${Math.ceil(cartTotal)})
                  </button>

                  {cashAmount >= cartTotal && (
                    <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                      <div className="flex justify-between">
                        <span className="text-success font-medium">Change Due</span>
                        <span className="font-mono-numbers font-bold text-success text-xl">
                          ${change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Process Button */}
              <Button
                variant="pos-primary"
                size="xl"
                className="w-full"
                onClick={handlePayment}
                disabled={processing || (paymentMethod === 'cash' && cashAmount < cartTotal)}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Complete Payment - $${cartTotal.toFixed(2)}`
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {lastTransaction && (
        <ReceiptModal
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          transaction={lastTransaction}
        />
      )}
    </>
  );
};
