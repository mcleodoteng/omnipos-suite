import { useState, useMemo } from 'react';
import { Search, Package, ZoomIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext';
import { categories } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { ProductDetailModal } from '@/components/pos/ProductDetailModal';
import { Product } from '@/types/pos';

export const ProductGrid = () => {
  const { products, addToCart } = usePOS();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.barcode?.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All Items' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleViewDetails = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search products, SKU, or scan barcode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-muted border-border focus:border-primary" />
        </div>
      </div>

      <div className="flex gap-2 p-4 overflow-x-auto border-b border-border">
        {categories.map(category => (
          <button key={category.id} onClick={() => setSelectedCategory(category.name)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200', selectedCategory === category.name ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map(product => (
            <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock === 0} className={cn('pos-card pos-card-hover p-4 text-left transition-all duration-200 group relative', product.stock === 0 && 'opacity-50 cursor-not-allowed', product.stock > 0 && 'hover:scale-[1.02] active:scale-[0.98]')}>
              <div className="aspect-square rounded-lg bg-secondary mb-3 flex items-center justify-center overflow-hidden group-hover:bg-secondary/70 transition-colors relative">
                <Package className="w-10 h-10 text-muted-foreground" />
                <button onClick={(e) => handleViewDetails(e, product)} className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <div className="p-2 rounded-full bg-white/90 text-foreground"><ZoomIn className="w-5 h-5" /></div>
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground text-sm line-clamp-2 leading-tight">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono-numbers font-bold text-primary text-lg">{formatPrice(product.price)}</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', product.stock > 20 ? 'bg-success/10 text-success' : product.stock > 0 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')}>
                    {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground"><Package className="w-12 h-12 mb-3 opacity-50" /><p>No products found</p></div>
        )}
      </div>

      <ProductDetailModal open={showDetailModal} onClose={() => setShowDetailModal(false)} product={selectedProduct} onAddToCart={addToCart} />
    </div>
  );
};
