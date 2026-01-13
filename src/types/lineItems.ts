// Extended line item type with range support

export interface RangeLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;      // Used for fixed price OR min price
  unitPriceMax?: number;  // If set, indicates a price range
  isRange: boolean;       // Toggle for range mode
}

/**
 * Calculate total for a single line item
 * For ranges, returns the midpoint
 */
export function calculateLineItemTotal(item: RangeLineItem): number {
  if (item.isRange && item.unitPriceMax !== undefined) {
    const midPrice = (item.unitPrice + item.unitPriceMax) / 2;
    return item.quantity * midPrice;
  }
  return item.quantity * item.unitPrice;
}

/**
 * Calculate min total for a single line item
 */
export function calculateLineItemMinTotal(item: RangeLineItem): number {
  return item.quantity * item.unitPrice;
}

/**
 * Calculate max total for a single line item
 */
export function calculateLineItemMaxTotal(item: RangeLineItem): number {
  if (item.isRange && item.unitPriceMax !== undefined) {
    return item.quantity * item.unitPriceMax;
  }
  return item.quantity * item.unitPrice;
}

/**
 * Format price display for a line item
 */
export function formatLineItemPrice(item: RangeLineItem): string {
  if (item.isRange && item.unitPriceMax !== undefined && item.unitPriceMax > item.unitPrice) {
    return `$${item.unitPrice.toFixed(2)} - $${item.unitPriceMax.toFixed(2)}`;
  }
  return `$${item.unitPrice.toFixed(2)}`;
}

/**
 * Format total display for a collection of line items
 */
export function formatTotalRange(items: RangeLineItem[]): string {
  const minTotal = items.reduce((sum, item) => sum + calculateLineItemMinTotal(item), 0);
  const maxTotal = items.reduce((sum, item) => sum + calculateLineItemMaxTotal(item), 0);
  
  if (maxTotal > minTotal) {
    return `$${minTotal.toFixed(2)} - $${maxTotal.toFixed(2)}`;
  }
  return `$${minTotal.toFixed(2)}`;
}

/**
 * Convert legacy LineItem to RangeLineItem
 */
export function toRangeLineItem(item: { id: string; description: string; quantity: number; unitPrice: number }): RangeLineItem {
  return {
    ...item,
    isRange: false,
  };
}

/**
 * Convert RangeLineItem to legacy LineItem (uses min price)
 */
export function fromRangeLineItem(item: RangeLineItem): { id: string; description: string; quantity: number; unitPrice: number } {
  return {
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  };
}
