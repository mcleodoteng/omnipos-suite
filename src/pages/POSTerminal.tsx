import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePOS } from '@/contexts/POSContext';
import { Badge } from '@/components/ui/badge';

export const POSTerminal = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { cart } = usePOS();
  
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MainLayout>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col lg:flex-row">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProductGrid />
        </div>
        
        {/* Desktop Cart - Right Side */}
        <div className="hidden lg:block w-96 flex-shrink-0">
          <Cart />
        </div>

        {/* Mobile Cart Button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="pos-primary" 
                size="lg" 
                className="rounded-full w-16 h-16 shadow-xl relative"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center bg-destructive text-destructive-foreground"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl">
              <Cart />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </MainLayout>
  );
};

export default POSTerminal;
