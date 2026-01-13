import { useState, useEffect } from 'react';
import { Quote, Client, LineItem } from '@/types';
import { RangeLineItem, toRangeLineItem, fromRangeLineItem, formatTotalRange } from '@/types/lineItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupplierQuoteScanDialog } from '@/components/projects/SupplierQuoteScanDialog';
import { RangeLineItemInput } from '@/components/ui/range-line-item-input';

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote;
  clients: Client[];
  onSave: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
}

export function QuoteDialog({
  open,
  onOpenChange,
  quote,
  clients,
  onSave,
}: QuoteDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<Quote['status']>('draft');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<RangeLineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, isRange: false }
  ]);
  const [supplierScanOpen, setSupplierScanOpen] = useState(false);

  // Reset form when dialog opens/closes or quote changes
  useEffect(() => {
    if (open) {
      if (quote) {
        setTitle(quote.title);
        setClientId(quote.clientId);
        setStatus(quote.status);
        setNotes(quote.notes || '');
        setValidUntil(new Date(quote.validUntil).toISOString().split('T')[0]);
        // Convert legacy items to range items
        setItems(quote.items.map(toRangeLineItem));
      } else {
        setTitle('');
        setClientId('');
        setStatus('draft');
        setNotes('');
        setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, isRange: false }]);
      }
    }
  }, [open, quote]);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, isRange: false }]);
  };

  const handleImportItems = (importedItems: LineItem[]) => {
    // Remove empty placeholder items before importing
    const nonEmptyItems = items.filter(item => item.description.trim() !== '' || item.unitPrice > 0);
    // Convert imported items to range items
    setItems([...nonEmptyItems, ...importedItems.map(toRangeLineItem)]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, updatedItem: RangeLineItem) => {
    setItems(items.map((item) => item.id === id ? updatedItem : item));
  };

  const totalDisplay = formatTotalRange(items);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({ title: 'Please enter a quote title', variant: 'destructive' });
      return;
    }
    
    if (!clientId) {
      toast({ title: 'Please select a client', variant: 'destructive' });
      return;
    }

    onSave({
      title,
      clientId,
      status,
      notes,
      validUntil: new Date(validUntil),
      // Convert range items back to legacy format for storage (uses min price)
      items: items.map(fromRangeLineItem),
    });

    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quote ? 'Edit Quote' : 'New Quote'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Quote Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kitchen Renovation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Quote['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label>Line Items</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSupplierScanOpen(true)}>
                  <Store className="h-4 w-4 mr-1" />
                  Add Items to Quote
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: Click the ↔ button to toggle between fixed price and price range (e.g., $300-$500)
            </p>

            <div className="space-y-3">
              {items.map((item) => (
                <RangeLineItemInput
                  key={item.id}
                  item={item}
                  onChange={(updated) => handleItemChange(item.id, updated)}
                  onRemove={() => handleRemoveItem(item.id)}
                  canRemove={items.length > 1}
                />
              ))}
            </div>

            <div className="text-right font-semibold text-lg">
              Total: {totalDisplay}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {quote ? 'Update Quote' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <SupplierQuoteScanDialog
      open={supplierScanOpen}
      onOpenChange={setSupplierScanOpen}
      onImport={handleImportItems}
    />
    </>
  );
}
