import { useState, useEffect, useRef } from 'react';
import { X, Package, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Product, Category } from '@/types/pos';
import { useCurrency } from '@/hooks/useCurrency';
import { usePOS } from '@/contexts/POSContext';
import { addStockAdjustment } from '@/lib/stockAdjustments';
import { usePOS } from '@/contexts/POSContext';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  mode: 'add' | 'edit' | 'view';
}

const generateSKU = (category: string) => {
  const prefix = category.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${random}`;
};

const generateBarcode = () => {
  return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
};

export const ProductModal = ({ open, onClose, onSave, product, mode }: ProductModalProps) => {
  const { symbol } = useCurrency();
  const { currentUser } = usePOS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>();
  const [originalStock, setOriginalStock] = useState(0);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    costPrice: 0,
    category: 'Beverages',
    sku: '',
    stock: 0,
    barcode: '',
    description: '',
    unit: 'pcs',
    image: '',
  });

  useEffect(() => {
    const storedCategories = getStoredCategories();
    setCategories(storedCategories.filter(c => c.name !== 'All Items'));
  }, [open]);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setOriginalStock(product.stock);
    } else {
      const defaultCategory = categories && categories.length > 0 ? categories[0].name : 'Beverages';
      setFormData({
        name: '',
        price: 0,
        costPrice: 0,
        category: defaultCategory,
        sku: generateSKU(defaultCategory),
        stock: 0,
        barcode: generateBarcode(),
        description: '',
        unit: 'pcs',
        image: '',
      });
      setOriginalStock(0);
    }
  }, [product, open, categories]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({ ...formData, image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }

    const newStock = formData.stock || 0;
    const newProduct: Product = {
      id: product?.id || Date.now().toString(),
      name: formData.name || '',
      price: formData.price || 0,
      costPrice: formData.costPrice || 0,
      category: formData.category || 'Beverages',
      sku: formData.sku || generateSKU(formData.category || 'Beverages'),
      stock: newStock,
      barcode: formData.barcode || generateBarcode(),
      description: formData.description || '',
      unit: formData.unit || 'pcs',
      image: formData.image || '',
    };

    // Track stock adjustment if stock changed
    if (mode === 'edit' && newStock !== originalStock) {
      const adjustment = newStock - originalStock;
      addStockAdjustment({
        productId: newProduct.id,
        productName: newProduct.name,
        previousStock: originalStock,
        newStock: newStock,
        adjustment: adjustment,
        reason: adjustment > 0 ? 'Stock added via inventory edit' : 'Stock removed via inventory edit',
        adjustedBy: currentUser?.name || 'Unknown',
        type: adjustment > 0 ? 'add' : 'remove',
      });
    } else if (mode === 'add' && newStock > 0) {
      addStockAdjustment({
        productId: newProduct.id,
        productName: newProduct.name,
        previousStock: 0,
        newStock: newStock,
        adjustment: newStock,
        reason: 'Initial stock on product creation',
        adjustedBy: currentUser?.name || 'Unknown',
        type: 'add',
      });
    }

    onSave(newProduct);
    onClose();
  };

  if (!open) return null;

  const isViewMode = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {mode === 'add' ? 'Add New Product' : mode === 'edit' ? 'Edit Product' : 'Product Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Product Image</label>
            <div className="mt-2">
              {formData.image ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary">
                  <img 
                    src={formData.image} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isViewMode}
                  className="w-full h-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">Max 2MB, JPG/PNG</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isViewMode}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Product Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              className="mt-1"
              required
              disabled={isViewMode}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Selling Price ({symbol}) *</label>
              <NumberInput
                min={0}
                allowDecimals={true}
                value={formData.price || 0}
                onChange={(value) => setFormData({ ...formData, price: value })}
                className="mt-1"
                required
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cost Price ({symbol})</label>
              <NumberInput
                min={0}
                allowDecimals={true}
                value={formData.costPrice || 0}
                onChange={(value) => setFormData({ ...formData, costPrice: value })}
                className="mt-1"
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, sku: generateSKU(e.target.value) })}
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                disabled={isViewMode}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                disabled={isViewMode}
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="l">Liters (L)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="mt-1 font-mono"
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stock Quantity *</label>
              <NumberInput
                min={0}
                allowDecimals={false}
                value={formData.stock || 0}
                onChange={(value) => setFormData({ ...formData, stock: Math.floor(value) })}
                className="mt-1"
                required
                disabled={isViewMode}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Barcode</label>
            <Input
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Enter or scan barcode"
              className="mt-1 font-mono"
              disabled={isViewMode}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              className="mt-1 w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
              disabled={isViewMode}
            />
          </div>

          {/* Profit Margin Display */}
          {formData.price && formData.costPrice ? (
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit Margin</span>
                <span className="font-semibold text-success">
                  {symbol}{(formData.price - formData.costPrice).toFixed(2)} ({(((formData.price - formData.costPrice) / formData.price) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type="submit" variant="pos-primary" className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {mode === 'add' ? 'Add Product' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};