import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Camera, Upload, Loader2, Trash2, Store, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';

interface ExtractedItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  selected: boolean;
}

interface SupplierQuoteScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: LineItem[]) => void;
}

export function SupplierQuoteScanDialog({
  open,
  onOpenChange,
  onImport,
}: SupplierQuoteScanDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const resetState = () => {
    setImagePreview(null);
    setIsScanning(false);
    setSupplierName(null);
    setQuoteNumber(null);
    setExtractedItems([]);
    setHasScanned(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setHasScanned(false);
        setExtractedItems([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imagePreview) return;

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-supplier-quote', {
        body: { imageBase64: imagePreview },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Scan Issue',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setSupplierName(data.supplier_name);
      setQuoteNumber(data.quote_number);
      
      const items: ExtractedItem[] = (data.line_items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selected: true,
      }));

      setExtractedItems(items);
      setHasScanned(true);

      if (items.length === 0) {
        toast({
          title: 'No items found',
          description: 'Could not extract any line items. Try a clearer image.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Quote scanned!',
          description: `Found ${items.length} items from ${data.supplier_name || 'supplier'}`,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Scan failed',
        description: 'Could not process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleItem = (id: string) => {
    setExtractedItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setExtractedItems(items => items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    setExtractedItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleImport = () => {
    const selectedItems = extractedItems
      .filter(item => item.selected)
      .map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to import.',
        variant: 'destructive',
      });
      return;
    }

    onImport(selectedItems);
    toast({
      title: 'Items imported!',
      description: `Added ${selectedItems.length} items to your quote.`,
    });
    resetState();
    onOpenChange(false);
  };

  const calculateTotal = () => {
    return extractedItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Scan Supplier Quote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image upload section */}
          <div className="space-y-2">
            <Label>Quote Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Quote preview"
                  className="w-full max-h-48 object-contain rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setHasScanned(false);
                    setExtractedItems([]);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            )}
          </div>

          {/* Scan button */}
          {imagePreview && !hasScanned && (
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning Quote...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Scan Quote
                </>
              )}
            </Button>
          )}

          {/* Extracted data */}
          {hasScanned && (
            <>
              {/* Supplier info */}
              {(supplierName || quoteNumber) && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    {supplierName && (
                      <span className="font-medium">{supplierName}</span>
                    )}
                    {quoteNumber && (
                      <span className="text-muted-foreground">#{quoteNumber}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted items */}
              <div className="space-y-2">
                <Label>Extracted Items ({extractedItems.filter(i => i.selected).length} selected)</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {extractedItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg space-y-2 ${item.selected ? 'border-primary bg-primary/5' : 'opacity-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <div className="w-20">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                            <span className="text-sm font-medium self-center w-24 text-right">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {extractedItems.length > 0 && (
                  <div className="text-right font-semibold text-lg pt-2 border-t">
                    Selected Total: ${calculateTotal().toFixed(2)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
            Cancel
          </Button>
          {hasScanned && extractedItems.length > 0 && (
            <Button onClick={handleImport}>
              Import {extractedItems.filter(i => i.selected).length} Items
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
