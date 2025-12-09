import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Package, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext';
import { cn } from '@/lib/utils';
import { categories } from '@/data/mockData';
import { toast } from 'sonner';
import { Product } from '@/types/pos';
import { ProductModal } from '@/components/inventory/ProductModal';
import { useCurrency } from '@/hooks/useCurrency';

export const Inventory = () => {
  const { products, setProducts, settings } = usePOS();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All Items' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const lowStockThreshold = settings.lowStockThreshold || 20;

  const stats = useMemo(() => ({
    totalProducts: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < lowStockThreshold).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    wellStocked: products.filter(p => p.stock >= lowStockThreshold).length,
  }), [products, lowStockThreshold]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveProduct = (product: Product) => {
    if (modalMode === 'add') {
      setProducts(prev => [...prev, product]);
      toast.success('Product added successfully');
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      toast.success('Product updated successfully');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted');
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Manage your products and stock levels</p>
          </div>
          <Button variant="pos-primary" onClick={handleAddProduct} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.totalProducts}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></div>
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.wellStocked}</p><p className="text-sm text-muted-foreground">Well Stocked</p></div></div></div>
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.lowStock}</p><p className="text-sm text-muted-foreground">Low Stock</p></div></div></div>
          <div className="pos-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><Package className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl font-bold font-mono-numbers text-foreground">{stats.outOfStock}</p><p className="text-sm text-muted-foreground">Out of Stock</p></div></div></div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(category => (
              <button key={category.id} onClick={() => setSelectedCategory(category.name)} className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200', selectedCategory === category.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pos-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">SKU</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Price</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Stock</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4"><div className="flex items-center gap-3">{product.image ? <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>}<span className="font-medium text-foreground">{product.name}</span></div></td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-sm">{product.sku}</td>
                    <td className="py-4 px-4"><span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{product.category}</span></td>
                    <td className="py-4 px-4 text-right font-mono-numbers font-semibold text-foreground">{formatPrice(product.price)}</td>
                    <td className="py-4 px-4 text-center font-mono-numbers font-semibold text-foreground">{product.stock}</td>
                    <td className="py-4 px-4 text-center"><span className={cn('px-2 py-1 rounded-full text-xs font-medium', product.stock === 0 ? 'bg-destructive/10 text-destructive' : product.stock < lowStockThreshold ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>{product.stock === 0 ? 'Out of Stock' : product.stock < lowStockThreshold ? 'Low Stock' : 'In Stock'}</span></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewProduct(product)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEditProduct(product)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Package className="w-12 h-12 mb-3 opacity-50" /><p className="text-lg font-medium">No products found</p></div>
          )}
        </div>
      </div>

      <ProductModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSaveProduct} product={selectedProduct} mode={modalMode} />
    </MainLayout>
  );
};

export default Inventory;
