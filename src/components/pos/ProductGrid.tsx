import { useState, useMemo, useEffect } from 'react';
import { Search, Package, ZoomIn, Grid3X3, List, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext';
import { getStoredCategories } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { ProductDetailModal } from '@/components/pos/ProductDetailModal';
import { Product, Category } from '@/types/pos';

export const ProductGrid = () => {
  const { products, addToCart, transactions } = usePOS();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setCategories(getStoredCategories());
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.barcode?.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All Items' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Get top selling products
  const topProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        productSales[item.product.id] = (productSales[item.product.id] || 0) + item.quantity;
      });
    });
    return Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
  }, [transactions]);

  const handleViewDetails = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Enhanced Search Header */}
      <div className="p-4 bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search products, SKU, or scan barcode..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-12 h-14 bg-background/80 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-base shadow-sm" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-3 rounded-lg transition-all',
                viewMode === 'grid' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-3 rounded-lg transition-all',
                viewMode === 'list' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
        {categories.map(category => (
          <button 
            key={category.id} 
            onClick={() => setSelectedCategory(category.name)} 
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300',
              selectedCategory === category.name 
                ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary hover:scale-102'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Products Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const isTopSeller = topProducts.includes(product.id);
              return (
                <button 
                  key={product.id} 
                  onClick={() => handleAddToCart(product)} 
                  disabled={product.stock === 0} 
                  className={cn(
                    'group relative bg-card rounded-2xl p-4 text-left transition-all duration-300 border border-border/50 overflow-hidden',
                    product.stock === 0 && 'opacity-50 cursor-not-allowed',
                    product.stock > 0 && 'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1 active:scale-[0.98]'
                  )}
                >
                  {/* Top Seller Badge */}
                  {isTopSeller && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-lg">
                      <TrendingUp className="w-3 h-3" />
                      TOP
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-secondary to-secondary/50 mb-3 flex items-center justify-center overflow-hidden relative">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/50" />
                    )}
                    
                    {/* Hover Overlay */}
                    <div 
                      onClick={(e) => handleViewDetails(e, product)}
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <div className="p-3 rounded-full bg-white/95 text-foreground shadow-xl">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                        <span className="text-white text-xs font-medium">View Details</span>
                      </div>
                    </div>

                    {/* Quick Add Animation Overlay */}
                    {product.stock > 0 && (
                      <div className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg transform scale-75 group-hover:scale-100">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono-numbers font-bold text-primary text-lg">
                        {formatPrice(product.price)}
                      </span>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider',
                        product.stock > 20 
                          ? 'bg-success/10 text-success border border-success/20' 
                          : product.stock > 0 
                            ? 'bg-warning/10 text-warning border border-warning/20' 
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                      )}>
                        {product.stock > 0 ? `${product.stock} left` : 'Sold Out'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map(product => {
              const isTopSeller = topProducts.includes(product.id);
              return (
                <button 
                  key={product.id} 
                  onClick={() => handleAddToCart(product)} 
                  disabled={product.stock === 0} 
                  className={cn(
                    'group w-full flex items-center gap-4 bg-card rounded-xl p-3 text-left transition-all duration-200 border border-border/50',
                    product.stock === 0 && 'opacity-50 cursor-not-allowed',
                    product.stock > 0 && 'hover:shadow-lg hover:border-primary/30 active:scale-[0.99]'
                  )}
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground/50" />
                    )}
                    {isTopSeller && (
                      <div className="absolute -top-1 -right-1 p-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                  </div>

                  {/* Stock */}
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-full uppercase',
                    product.stock > 20 
                      ? 'bg-success/10 text-success' 
                      : product.stock > 0 
                        ? 'bg-warning/10 text-warning' 
                        : 'bg-destructive/10 text-destructive'
                  )}>
                    {product.stock > 0 ? `${product.stock}` : 'Out'}
                  </span>

                  {/* Price */}
                  <span className="font-mono-numbers font-bold text-primary text-lg min-w-[80px] text-right">
                    {formatPrice(product.price)}
                  </span>

                  {/* View Details */}
                  <button 
                    onClick={(e) => handleViewDetails(e, product)}
                    className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </button>
              );
            })}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="p-6 rounded-full bg-secondary/50 mb-4">
              <Package className="w-12 h-12 opacity-50" />
            </div>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      <ProductDetailModal 
        open={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
        product={selectedProduct} 
        onAddToCart={handleAddToCart} 
      />
    </div>
  );
};