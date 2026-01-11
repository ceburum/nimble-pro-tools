import { useState, useRef } from 'react';
import { Receipt, Upload, X, Scan, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';

interface InvoiceReceiptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (storagePath: string, storeName: string, amount: number) => void;
}

export function InvoiceReceiptUploadDialog({
  open,
  onOpenChange,
  onSave,
}: InvoiceReceiptUploadDialogProps) {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setFile(nextFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewBase64(reader.result as string);
    };
    reader.readAsDataURL(nextFile);
  };

  const handleScanReceipt = async () => {
    if (!previewBase64) {
      toast.error('Please upload a receipt image first');
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64: previewBase64 },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.store_name) setStoreName(String(data.store_name));
      if (data?.total_amount != null) setAmount(String(data.total_amount));

      toast.success('Receipt scanned');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan receipt. Please enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!file || !storeName || !amount || !user) return;

    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }

    setIsSaving(true);
    try {
      // Upload to storage bucket
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `${user.id}/invoice-receipts/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      onSave(storagePath, storeName, parsedAmount);
      handleClose();
      toast.success('Receipt added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStoreName('');
    setAmount('');
    setPreviewBase64(null);
    setFile(null);
    setIsScanning(false);
    setIsSaving(false);
    onOpenChange(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Add Receipt to Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Receipt Photo</Label>
              {previewBase64 ? (
                <div className="relative">
                  <img
                    src={previewBase64}
                    alt="Receipt preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewBase64(null);
                      setFile(null);
                      setStoreName('');
                      setAmount('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {previewBase64 && (
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
                    Scan Receipt
                  </>
                )}
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
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
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border pt-3 mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!file || !storeName || !amount || isSaving}
          >
            {isSaving ? 'Saving...' : 'Add Receipt'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
