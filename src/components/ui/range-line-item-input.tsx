import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowRightLeft } from 'lucide-react';
import { RangeLineItem } from '@/types/lineItems';
import { LineItemInput } from '@/components/ui/line-item-input';
import { cn } from '@/lib/utils';

interface RangeLineItemInputProps {
  item: RangeLineItem;
  onChange: (item: RangeLineItem) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

export function RangeLineItemInput({
  item,
  onChange,
  onRemove,
  canRemove = true,
}: RangeLineItemInputProps) {
  const handleToggleRange = () => {
    if (item.isRange) {
      // Converting from range to fixed - use min price
      onChange({
        ...item,
        isRange: false,
        unitPriceMax: undefined,
      });
    } else {
      // Converting from fixed to range - set max to current price + 20%
      onChange({
        ...item,
        isRange: true,
        unitPriceMax: Math.round(item.unitPrice * 1.2 * 100) / 100 || 0,
      });
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        <LineItemInput
          placeholder="Description (e.g., Materials, Labor)"
          value={item.description}
          onChange={(val) => onChange({ ...item, description: val })}
        />
      </div>
      <div className="w-16">
        <Input
          type="number"
          placeholder="Qty"
          min="1"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: parseInt(e.target.value) || 1 })}
          className="text-center"
        />
      </div>
      <div className={cn('flex items-center gap-1', item.isRange ? 'w-48' : 'w-24')}>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            placeholder={item.isRange ? 'Min' : 'Price'}
            min="0"
            step="0.01"
            value={item.unitPrice || ''}
            onChange={(e) => onChange({ ...item, unitPrice: parseFloat(e.target.value) || 0 })}
            className="pl-5"
          />
        </div>
        {item.isRange && (
          <>
            <span className="text-muted-foreground text-sm">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                placeholder="Max"
                min={item.unitPrice || 0}
                step="0.01"
                value={item.unitPriceMax || ''}
                onChange={(e) => onChange({ ...item, unitPriceMax: parseFloat(e.target.value) || 0 })}
                className="pl-5"
              />
            </div>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={handleToggleRange}
        title={item.isRange ? 'Switch to fixed price' : 'Switch to price range'}
      >
        <ArrowRightLeft className={cn('h-4 w-4', item.isRange && 'text-primary')} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={onRemove}
        disabled={!canRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
