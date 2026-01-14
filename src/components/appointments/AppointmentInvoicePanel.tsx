import { useState } from 'react';
import { Receipt, Plus, Trash2, Send, CheckCircle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Invoice, LineItem } from '@/types';
import { useInvoices } from '@/hooks/useInvoices';
import { toast } from 'sonner';

interface AppointmentInvoicePanelProps {
  invoice: Invoice | null;
  appointmentId: string;
  clientId: string;
  onCreateInvoice: () => Promise<void>;
  onClose?: () => void;
}

export function AppointmentInvoicePanel({
  invoice,
  appointmentId,
  clientId,
  onCreateInvoice,
  onClose,
}: AppointmentInvoicePanelProps) {
  const { updateInvoice } = useInvoices();
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<LineItem[]>([]);

  const handleStartEdit = () => {
    if (invoice) {
      setEditItems([...invoice.items]);
      setEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!invoice) return;
    
    const success = await updateInvoice(invoice.id, { items: editItems });
    if (success) {
      toast.success('Invoice updated');
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditItems([]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setEditItems(items => 
      items.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const handleRemoveItem = (id: string) => {
    setEditItems(items => items.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    setEditItems(items => [
      ...items,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleMarkSent = async () => {
    if (!invoice) return;
    const success = await updateInvoice(invoice.id, { status: 'sent' });
    if (success) {
      toast.success('Invoice marked as sent');
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    const success = await updateInvoice(invoice.id, { 
      status: 'paid', 
      paidAt: new Date() 
    });
    if (success) {
      toast.success('Invoice marked as paid');
    }
  };

  const total = invoice?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const editTotal = editItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // No invoice yet - show create button
  if (!invoice) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No invoice for this appointment yet.
            </p>
            <Button size="sm" onClick={onCreateInvoice}>
              <Plus className="h-4 w-4 mr-1" />
              Create Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {invoice.invoiceNumber}
          </CardTitle>
          <Badge className={statusColors[invoice.status]}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line Items */}
        {editing ? (
          <div className="space-y-2">
            {editItems.map((item) => (
              <div key={item.id} className="flex gap-2 items-center">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-14 h-8 text-sm"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice || ''}
                  onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 text-sm"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {invoice.items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No items yet. Add services from the menu.
              </p>
            ) : (
              invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.description} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-medium">Total</span>
          <span className="text-lg font-bold">
            ${(editing ? editTotal : total).toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {invoice.status === 'draft' && (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={handleMarkSent}>
                    <Send className="h-3 w-3 mr-1" />
                    Mark Sent
                  </Button>
                </>
              )}
              {invoice.status === 'sent' && (
                <Button size="sm" onClick={handleMarkPaid}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark Paid
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
