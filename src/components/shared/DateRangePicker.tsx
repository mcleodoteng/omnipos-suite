import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Yesterday', getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: 'Last 7 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: 'Last 30 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'This Year', getValue: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
];

export const DateRangePicker = ({ value, onChange, className }: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(format(value.from, 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(value.to, 'yyyy-MM-dd'));

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setCustomFrom(format(range.from, 'yyyy-MM-dd'));
    setCustomTo(format(range.to, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const handleCustomApply = () => {
    onChange({
      from: startOfDay(new Date(customFrom)),
      to: endOfDay(new Date(customTo)),
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start text-left font-normal', className)}>
          <Calendar className="w-4 h-4 mr-2" />
          {format(value.from, 'MMM d, yyyy')} - {format(value.to, 'MMM d, yyyy')}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Select Date Range</p>
        </div>
        
        <div className="p-3 space-y-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        <div className="p-3 border-t border-border space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Custom Range</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
              />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={handleCustomApply}>
            Apply Custom Range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
