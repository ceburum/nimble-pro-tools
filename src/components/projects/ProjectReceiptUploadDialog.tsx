import { useState, useRef } from 'react';
import { Receipt, Upload, X, Scan, Loader2, Package, Trash2 } from 'lucide-react';
import { ProjectReceipt, LineItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScannedLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface ProjectReceiptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (receipt: ProjectReceipt, lineItems?: LineItem[]) => void;
}

export function ProjectReceiptUploadDialog({ open, onOpenChange, projectId, onSave }: ProjectReceiptUploadDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedLineItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanReceipt = async () => {
    if (!preview) {
      toast.error('Please upload a receipt image first');
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64: preview }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Auto-fill the fields with scanned data
      if (data.store_name) {
        setDescription(data.store_name);
      }
      if (data.total_amount) {
        setAmount(data.total_amount.toString());
      }
      
      // Set scanned line items
      if (data.line_items && data.line_items.length > 0) {
        setScannedItems(data.line_items);
        toast.success(`Scanned ${data.line_items.length} items from receipt!`);
      } else {
        toast.success('Receipt scanned - no individual items found');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan receipt. Please enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!description || !amount) return;

    const receipt: ProjectReceipt = {
      id: Date.now().toString(),
      projectId,
      dataUrl: preview || '',
      description,
      amount: parseFloat(amount),
      createdAt: new Date(),
    };

    // Convert scanned items to LineItem format
    const lineItems: LineItem[] = scannedItems.map((item, index) => ({
      id: `receipt-item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    }));

    onSave(receipt, lineItems.length > 0 ? lineItems : undefined);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setPreview(null);
    setIsScanning(false);
    setScannedItems([]);
    onOpenChange(false);
  };

  const itemsTotal = scannedItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Add Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Receipt Photo</Label>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Receipt preview" className="w-full h-40 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreview(null);
                      setDescription('');
                      setAmount('');
                      setScannedItems([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload receipt image</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {preview && (
              <Button 
                onClick={handleScanReceipt} 
                disabled={isScanning}
                variant="secondary"
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Receipt (Auto-fill)
                  </>
                )}
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Store / Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Home Depot"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>

            {/* Scanned Line Items */}
            {scannedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Scanned Items ({scannedItems.length})
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Total: ${itemsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scannedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ${item.unit_price.toFixed(2)} = ${(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  These items will be added to the quote as individual line items
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!description || !amount}>Save Receipt</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
