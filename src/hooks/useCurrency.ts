import { usePOS } from '@/contexts/POSContext';
import { CURRENCIES } from '@/types/pos';

export const useCurrency = () => {
  const { settings } = usePOS();
  
  const currency = CURRENCIES.find(c => c.code === settings.currency) || CURRENCIES[0];
  
  const formatPrice = (amount: number): string => {
    return `${currency.symbol}${amount.toFixed(2)}`;
  };
  
  const formatPriceCompact = (amount: number): string => {
    if (amount >= 1000000) {
      return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${currency.symbol}${(amount / 1000).toFixed(1)}K`;
    }
    return formatPrice(amount);
  };
  
  return {
    currency,
    formatPrice,
    formatPriceCompact,
    symbol: currency.symbol,
    code: currency.code,
  };
};
