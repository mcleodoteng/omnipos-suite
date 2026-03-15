import { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Printer, Trash2, Eye, Search, Send, CheckCircle, XCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePOS } from '@/contexts/POSContext';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { Invoice, InvoiceItem, Product } from '@/types/pos';
import { getAllInvoices, createInvoice, updateInvoiceStatus, deleteInvoice, getNextInvoiceNumber } from '@/lib/database/repositories/invoiceRepository';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const generateId = () => crypto.randomUUID?.() || Date.now().toString();

const InvoiceForm = ({ 
  onSave, 
  onCancel, 
  products, 
  settings,
  formatPrice,
  symbol,
}: { 
  onSave: (invoice: Invoice) => void; 
  onCancel: () => void;
  products: Product[];
  settings: any;
  formatPrice: (n: number) => string;
  symbol: string;
}) => {
  const { currentUser } = usePOS();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState<string | null>(null);

  useEffect(() => {
    getNextInvoiceNumber().then(setInvoiceNumber);
  }, []);

  const taxRate = settings.taxRate / 100;
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax - discount;

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const selectProduct = (itemId: string, product: Product) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, description: product.name, unitPrice: product.price, total: product.price * item.quantity };
    }));
    setShowProductSearch(null);
    setSearchQuery('');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (status: 'draft' | 'sent') => {
    if (!clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (items.some(i => !i.description.trim())) {
      toast.error('All items must have a description');
      return;
    }

    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber,
      clientName,
      clientEmail: clientEmail || undefined,
      clientPhone: clientPhone || undefined,
      clientAddress: clientAddress || undefined,
      items,
      subtotal,
      tax,
      taxRate: settings.taxRate,
      discount,
      total,
      notes: notes || undefined,
      status,
      createdAt: new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: currentUser?.name || 'Unknown',
    };

    onSave(invoice);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Client Information</h3>
          <Input placeholder="Client Name *" value={clientName} onChange={e => setClientName(e.target.value)} />
          <Input placeholder="Email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          <Input placeholder="Phone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          <Input placeholder="Address" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Invoice Details</h3>
          <div>
            <label className="text-sm text-muted-foreground">Invoice Number</label>
            <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Due Date</label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Items</h3>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
        
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-24">Qty</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-32">Unit Price ({symbol})</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground w-32">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="py-2 px-4 relative">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Item description"
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowProductSearch(showProductSearch === item.id ? null : item.id); setSearchQuery(''); }}
                        className="shrink-0"
                        title="Select from inventory"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    {showProductSearch === item.id && (
                      <div className="absolute z-50 top-full left-4 right-4 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1">
                        <div className="p-2 border-b border-border">
                          <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                        </div>
                        {filteredProducts.slice(0, 10).map(p => (
                          <button
                            key={p.id}
                            onClick={() => selectProduct(item.id, p)}
                            className="w-full text-left px-3 py-2 hover:bg-secondary/50 text-sm flex justify-between"
                          >
                            <span>{p.name}</span>
                            <span className="text-muted-foreground">{formatPrice(p.price)}</span>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">No products found</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <NumberInput value={item.quantity} onChange={v => updateItem(item.id, 'quantity', v)} min={1} allowDecimals={false} className="text-center" />
                  </td>
                  <td className="py-2 px-4">
                    <NumberInput value={item.unitPrice} onChange={v => updateItem(item.id, 'unitPrice', v)} min={0} className="text-right" />
                  </td>
                  <td className="py-2 px-4 text-right font-mono-numbers font-semibold text-foreground">
                    {formatPrice(item.total)}
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" disabled={items.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono-numbers">{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax ({settings.taxRate}%)</span><span className="font-mono-numbers">{formatPrice(tax)}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Discount</span>
            <NumberInput value={discount} onChange={setDiscount} min={0} className="w-28 text-right" />
          </div>
          <div className="flex justify-between pt-2 border-t border-border text-lg font-bold">
            <span>Total</span>
            <span className="font-mono-numbers text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Notes</label>
        <textarea 
          className="mt-1 w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Additional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="outline" onClick={() => handleSave('draft')}>Save Draft</Button>
        <Button variant="pos-primary" onClick={() => handleSave('sent')}>
          <Send className="w-4 h-4 mr-2" /> Create & Send
        </Button>
      </div>
    </div>
  );
};

// Invoice Preview/Print
const InvoicePreview = ({ invoice, settings, formatPrice, onClose }: { 
  invoice: Invoice; settings: any; formatPrice: (n: number) => string; onClose: () => void 
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .store-name { font-size: 28px; font-weight: bold; color: #2563eb; }
        .store-details { font-size: 12px; color: #666; margin-top: 4px; }
        .invoice-title { font-size: 32px; font-weight: bold; color: #333; text-align: right; }
        .invoice-num { font-size: 14px; color: #666; text-align: right; }
        .client-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .section-label { font-size: 11px; text-transform: uppercase; color: #999; margin-bottom: 8px; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .totals { text-align: right; }
        .totals td { border: none; padding: 6px 12px; }
        .grand-total { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb !important; }
        .notes { margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #666; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print</Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
      
      <div ref={printRef} className="bg-white text-black p-8 rounded-lg border">
        {/* Letterhead */}
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '3px solid #2563eb', paddingBottom: '20px' }}>
          <div>
            <div className="store-name" style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{settings.storeName}</div>
            <div className="store-details" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              <div>{settings.storeAddress}</div>
              <div>Phone: {settings.storePhone}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>INVOICE</div>
            <div style={{ fontSize: '14px', color: '#666' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Date: {invoice.createdAt.toLocaleDateString()}
              {invoice.dueDate && <><br />Due: {invoice.dueDate.toLocaleDateString()}</>}
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#999', marginBottom: '8px', letterSpacing: '1px' }}>Bill To</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{invoice.clientName}</div>
          {invoice.clientAddress && <div style={{ fontSize: '13px', color: '#666' }}>{invoice.clientAddress}</div>}
          {invoice.clientPhone && <div style={{ fontSize: '13px', color: '#666' }}>Phone: {invoice.clientPhone}</div>}
          {invoice.clientEmail && <div style={{ fontSize: '13px', color: '#666' }}>Email: {invoice.clientEmail}</div>}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#666', borderBottom: '2px solid #e2e8f0' }}>#</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#666', borderBottom: '2px solid #e2e8f0' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', color: '#666', borderBottom: '2px solid #e2e8f0' }}>Qty</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#666', borderBottom: '2px solid #e2e8f0' }}>Unit Price</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#666', borderBottom: '2px solid #e2e8f0' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{i + 1}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{item.description}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatPrice(item.unitPrice)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ width: '280px' }}>
            <tbody>
              <tr><td style={{ padding: '6px 12px', color: '#666' }}>Subtotal</td><td style={{ padding: '6px 12px', textAlign: 'right' }}>{formatPrice(invoice.subtotal)}</td></tr>
              <tr><td style={{ padding: '6px 12px', color: '#666' }}>Tax ({invoice.taxRate}%)</td><td style={{ padding: '6px 12px', textAlign: 'right' }}>{formatPrice(invoice.tax)}</td></tr>
              {invoice.discount > 0 && <tr><td style={{ padding: '6px 12px', color: '#666' }}>Discount</td><td style={{ padding: '6px 12px', textAlign: 'right' }}>-{formatPrice(invoice.discount)}</td></tr>}
              <tr><td style={{ padding: '12px', fontWeight: 'bold', fontSize: '18px', color: '#2563eb', borderTop: '2px solid #2563eb' }}>Total</td><td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#2563eb', borderTop: '2px solid #2563eb' }}>{formatPrice(invoice.total)}</td></tr>
            </tbody>
          </table>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#999', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
          Thank you for your business! • {settings.storeName} • {settings.storePhone}
        </div>
      </div>
    </div>
  );
};

export const Invoices = () => {
  const { products, settings } = usePOS();
  const { formatPrice, symbol } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    getAllInvoices().then(setInvoices);
  }, []);

  const handleSave = async (invoice: Invoice) => {
    await createInvoice(invoice);
    setInvoices(prev => [invoice, ...prev]);
    setShowForm(false);
    toast.success(`Invoice ${invoice.invoiceNumber} created!`);
  };

  const handleStatusChange = async (id: string, status: Invoice['status']) => {
    await updateInvoiceStatus(id, status);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    toast.success(`Invoice marked as ${status}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    await deleteInvoice(id);
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success('Invoice deleted');
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    sent: 'bg-blue-500/10 text-blue-500',
    paid: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Create and manage invoices for clients</p>
          </div>
          {!showForm && !previewInvoice && (
            <Button variant="pos-primary" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" /> New Invoice
            </Button>
          )}
        </div>

        {showForm ? (
          <div className="pos-card">
            <h2 className="text-lg font-bold text-foreground mb-6">Create New Invoice</h2>
            <InvoiceForm 
              onSave={handleSave} 
              onCancel={() => setShowForm(false)} 
              products={products} 
              settings={settings}
              formatPrice={formatPrice}
              symbol={symbol}
            />
          </div>
        ) : previewInvoice ? (
          <InvoicePreview 
            invoice={previewInvoice} 
            settings={settings} 
            formatPrice={formatPrice} 
            onClose={() => setPreviewInvoice(null)} 
          />
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Search invoices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11" />
              </div>
              <div className="flex gap-2">
                {['all', 'draft', 'sent', 'paid', 'cancelled'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                    filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice List */}
            <div className="pos-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Invoice #</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Client</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Date</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(invoice => (
                      <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="py-4 px-4 font-mono text-sm text-foreground">{invoice.invoiceNumber}</td>
                        <td className="py-4 px-4 font-medium text-foreground">{invoice.clientName}</td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">{invoice.createdAt.toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right font-mono-numbers font-semibold text-foreground">{formatPrice(invoice.total)}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', statusColors[invoice.status])}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setPreviewInvoice(invoice)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="View"><Eye className="w-4 h-4" /></button>
                            {invoice.status === 'draft' && (
                              <button onClick={() => handleStatusChange(invoice.id, 'sent')} className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500" title="Mark Sent"><Send className="w-4 h-4" /></button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'draft') && (
                              <button onClick={() => handleStatusChange(invoice.id, 'paid')} className="p-2 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success" title="Mark Paid"><CheckCircle className="w-4 h-4" /></button>
                            )}
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <button onClick={() => handleStatusChange(invoice.id, 'cancelled')} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Cancel"><XCircle className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleDelete(invoice.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm">Create your first invoice to get started</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Invoices;
