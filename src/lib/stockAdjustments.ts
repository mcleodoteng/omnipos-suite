import { StockAdjustment } from '@/types/pos';

const STORAGE_KEY = 'swiftpos_stock_adjustments';

export const getStockAdjustments = (): StockAdjustment[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const adjustments = JSON.parse(stored);
      return adjustments.map((adj: any) => ({
        ...adj,
        adjustedAt: new Date(adj.adjustedAt),
      }));
    }
  } catch (e) {
    console.error('Error loading stock adjustments:', e);
  }
  return [];
};

export const saveStockAdjustments = (adjustments: StockAdjustment[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
  } catch (e) {
    console.error('Error saving stock adjustments:', e);
  }
};

export const addStockAdjustment = (adjustment: Omit<StockAdjustment, 'id' | 'adjustedAt'>): StockAdjustment => {
  const newAdjustment: StockAdjustment = {
    ...adjustment,
    id: Date.now().toString(),
    adjustedAt: new Date(),
  };
  
  const adjustments = getStockAdjustments();
  adjustments.unshift(newAdjustment);
  saveStockAdjustments(adjustments);
  
  return newAdjustment;
};

export const clearStockAdjustments = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};