import { MainLayout } from '@/components/layout/MainLayout';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';

export const POSTerminal = () => {
  return (
    <MainLayout>
      <div className="h-screen flex">
        {/* Product Grid - Left Side */}
        <div className="flex-1 flex flex-col">
          <ProductGrid />
        </div>
        
        {/* Cart - Right Side */}
        <div className="w-96">
          <Cart />
        </div>
      </div>
    </MainLayout>
  );
};

export default POSTerminal;
