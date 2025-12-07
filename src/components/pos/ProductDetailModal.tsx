import { X, Package, ShoppingCart, Tag, Barcode, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/pos';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailModal = ({ open, onClose, product, onAddToCart }: ProductDetailModalProps) => {
  const { formatPrice } = useCurrency();

  if (!open || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
        {/* Header with Image */}
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-20 h-20 text-muted-foreground/50" />
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Stock Badge */}
          <div className={cn(
            'absolute bottom-3 right-3 px-3 py-1 rounded-full text-sm font-medium',
            product.stock > 20 
              ? 'bg-success text-success-foreground' 
              : product.stock > 0
              ? 'bg-warning text-warning-foreground'
              : 'bg-destructive text-destructive-foreground'
          )}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Product Name & Price */}
          <div>
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            <p className="text-3xl font-bold text-primary mt-2 font-mono-numbers">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Tag className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">{product.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Layers className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">SKU</p>
                <p className="text-sm font-medium font-mono text-foreground">{product.sku}</p>
              </div>
            </div>
          </div>

          {product.barcode && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <Barcode className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Barcode</p>
                <p className="text-sm font-medium font-mono text-foreground">{product.barcode}</p>
              </div>
            </div>
          )}

          {product.description && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{product.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="pos-primary" 
              className="flex-1" 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
