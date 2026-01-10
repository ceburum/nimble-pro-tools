import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Invoice, Client, LineItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LineItemInput } from '@/components/ui/line-item-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSave: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  defaultClientId?: string | null;
}

export function InvoiceDialog({ open, onOpenChange, clients, onSave, defaultClientId }: InvoiceDialogProps) {
  const [clientId, setClientId] = useState<string>('');
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (defaultClientId) {
      setClientId(defaultClientId);
    }
  }, [defaultClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    onSave({
      clientId,
      invoiceNumber,
      items: items.filter((item) => item.description.trim()),
      status: 'draft',
      dueDate: new Date(dueDate),
      notes: notes || undefined,
    });

    // Reset form
    setClientId('');
    setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0 }]);
    setNotes('');
    onOpenChange(false);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
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
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <LineItemInput
                      placeholder="Description"
                      value={item.description}
                      onChange={(val) => updateItem(item.id, 'description', val)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total: </span>
                <span className="text-xl font-bold">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!clientId || items.every((i) => !i.description.trim())}>
              Create Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}