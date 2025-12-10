import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  decimalPlaces?: number;
}

/**
 * NumberInput component that prevents leading zeros and handles numeric input properly
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowDecimals = true, decimalPlaces = 2, min, ...props }, ref) => {
    // Format value for display - remove leading zeros
    const formatDisplayValue = (val: number | string): string => {
      if (val === '' || val === null || val === undefined) return '';
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(numVal)) return '';
      
      // For display, show the number without leading zeros
      if (allowDecimals) {
        // If it's a whole number, show without decimals
        // If it has decimals, show up to decimalPlaces
        return numVal.toString();
      }
      return Math.floor(numVal).toString();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty input
      if (inputValue === '') {
        onChange(0);
        return;
      }
      
      // Remove leading zeros (except for decimal numbers like 0.5)
      let cleanedValue = inputValue;
      
      // Handle leading zeros: "060" -> "60", but keep "0.6" as is
      if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
        cleanedValue = cleanedValue.replace(/^0+/, '') || '0';
      }
      
      // Parse the value
      const numValue = allowDecimals ? parseFloat(cleanedValue) : parseInt(cleanedValue, 10);
      
      if (!isNaN(numValue)) {
        // Apply minimum constraint if specified
        const minVal = min !== undefined ? Number(min) : undefined;
        if (minVal !== undefined && numValue < minVal) {
          onChange(minVal);
        } else {
          onChange(numValue);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Format on blur to ensure clean display
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
      props.onBlur?.(e);
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={formatDisplayValue(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
