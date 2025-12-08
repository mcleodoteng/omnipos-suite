import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/pos';
import { usePOS } from '@/contexts/POSContext';
import { useCurrency } from '@/hooks/useCurrency';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export const ReceiptModal = ({ open, onClose, transaction }: ReceiptModalProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings } = usePOS();
  const { formatPrice, symbol } = useCurrency();

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${transaction.receiptNumber}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                width: ${settings.receiptWidth}mm;
                margin: 0 auto;
                padding: 10px;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .border-t { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
              .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
              .flex { display: flex; justify-content: space-between; }
              .mb-2 { margin-bottom: 8px; }
              .text-lg { font-size: 14px; }
              .text-sm { font-size: 10px; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Receipt Preview</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-4">
          <div 
            ref={receiptRef}
            className="bg-white text-black p-4 rounded-lg font-mono text-sm"
          >
            {/* Store Header */}
            <div className="text-center border-b mb-2 pb-2" style={{ borderStyle: 'dashed' }}>
              <div className="font-bold text-lg">{settings.storeName}</div>
              <div className="text-sm">{settings.storeAddress}</div>
              <div className="text-sm">Tel: {settings.storePhone}</div>
            </div>

            {/* Transaction Info */}
            <div className="mb-2 text-sm">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{new Date(transaction.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{transaction.cashier}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-b py-2 my-2" style={{ borderStyle: 'dashed' }}>
              {transaction.items.map((item, index) => (
                <div key={index} className="mb-1">
                  <div className="flex justify-between">
                    <span className="truncate" style={{ maxWidth: '60%' }}>
                      {item.product.name}
                    </span>
                    <span>{symbol}{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="text-right text-sm" style={{ color: '#666' }}>
                    {item.quantity} x {symbol}{item.product.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{symbol}{transaction.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{settings.taxName} ({settings.taxRate}%):</span>
                <span>{symbol}{transaction.tax.toFixed(2)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{symbol}{transaction.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-1 mt-1" style={{ borderStyle: 'dashed' }}>
                <span>TOTAL:</span>
                <span>{symbol}{transaction.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-t pt-2 mt-2" style={{ borderStyle: 'dashed' }}>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="capitalize">{transaction.paymentMethod}</span>
              </div>
              {transaction.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span>Cash:</span>
                    <span>{symbol}{transaction.cashReceived?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change:</span>
                    <span>{symbol}{transaction.change?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-2 border-t text-sm" style={{ borderStyle: 'dashed' }}>
              <div className="font-bold">Thank you for shopping!</div>
              <div>Please come again</div>
              <div className="mt-2 text-xs" style={{ color: '#666' }}>
                Powered by SwiftPOS
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button variant="pos-primary" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};