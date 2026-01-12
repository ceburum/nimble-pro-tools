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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Loader2, Trash2, Store, FileText, Plus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LineItem } from '@/types';
import { ScanUpgradeDialog } from '@/components/scanner/ScanUpgradeDialog';
import { FREE_SCANS_PER_MONTH } from '@/config/aiScanner';

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
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [scansUsed, setScansUsed] = useState(0);

  // Manual entry items
  const [manualItems, setManualItems] = useState<ExtractedItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, selected: true }
  ]);

  const resetState = () => {
    setMode('scan');
    setImagePreview(null);
    setIsScanning(false);
    setSupplierName(null);
    setQuoteNumber(null);
    setExtractedItems([]);
    setHasScanned(false);
    setManualItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, selected: true }]);
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

      // Check for scan limit exceeded
      if (data?.code === 'SCAN_LIMIT_EXCEEDED') {
        setScansUsed(data.scansUsed || FREE_SCANS_PER_MONTH);
        setShowUpgradeDialog(true);
        return;
      }

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
      
      const items: ExtractedItem[] = (data.line_items || []).map((item: { description: string; quantity: number; unitPrice: number }) => ({
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

  // Manual entry handlers
  const handleAddManualItem = () => {
    setManualItems(items => [
      ...items,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, selected: true }
    ]);
  };

  const handleRemoveManualItem = (id: string) => {
    setManualItems(items => items.filter(item => item.id !== id));
  };

  const handleUpdateManualItem = (id: string, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    setManualItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleImport = () => {
    const itemsToImport = mode === 'scan' 
      ? extractedItems.filter(item => item.selected)
      : manualItems.filter(item => item.description.trim() !== '');

    const selectedItems = itemsToImport.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    if (selectedItems.length === 0) {
      toast({
        title: 'No items to import',
        description: mode === 'scan' ? 'Please select at least one item.' : 'Please add at least one item with a description.',
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

  const calculateTotal = (items: ExtractedItem[]) => {
    return items
      .filter(item => item.selected || mode === 'manual')
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleContinueManually = () => {
    setMode('manual');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Add Items from Quote
            </DialogTitle>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'scan' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Scan Quote
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Add Manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="space-y-4 mt-4">
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
                        Selected Total: ${calculateTotal(extractedItems).toFixed(2)}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button variant="outline" size="sm" onClick={handleAddManualItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {manualItems.map((item, index) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateManualItem(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <div className="w-20">
                              <Label className="text-xs text-muted-foreground">Qty</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateManualItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Unit Price</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateManualItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                            <div className="w-24 text-right">
                              <Label className="text-xs text-muted-foreground">Total</Label>
                              <p className="text-sm font-medium mt-2">
                                ${(item.quantity * item.unitPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {manualItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveManualItem(item.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {manualItems.length > 0 && (
                  <div className="text-right font-semibold text-lg pt-2 border-t">
                    Total: ${calculateTotal(manualItems).toFixed(2)}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
              Cancel
            </Button>
            {((mode === 'scan' && hasScanned && extractedItems.length > 0) || mode === 'manual') && (
              <Button onClick={handleImport}>
                Import {mode === 'scan' ? extractedItems.filter(i => i.selected).length : manualItems.filter(i => i.description.trim()).length} Items
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        scansUsed={scansUsed}
        onContinueManually={handleContinueManually}
      />
    </>
  );
}
