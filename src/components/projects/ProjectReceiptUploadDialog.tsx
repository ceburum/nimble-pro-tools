import { useState, useRef } from 'react';
import { Receipt, Upload, X, Scan, Loader2, Pencil, Camera } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScanUpgradeDialog } from '@/components/scanner/ScanUpgradeDialog';
import { FREE_SCANS_PER_MONTH } from '@/config/aiScanner';

interface ProjectReceiptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (file: File, storeName: string, totalAmount: number) => Promise<boolean>;
}

export function ProjectReceiptUploadDialog({
  open,
  onOpenChange,
  projectId,
  onSave,
}: ProjectReceiptUploadDialogProps) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [scansUsed, setScansUsed] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

      // Check for scan limit exceeded
      if (data?.code === 'SCAN_LIMIT_EXCEEDED') {
        setScansUsed(data.scansUsed || FREE_SCANS_PER_MONTH);
        setShowUpgradeDialog(true);
        return;
      }

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
    if (!file || !storeName || !amount) return;

    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }

    setIsSaving(true);
    try {
      const ok = await onSave(file, storeName, parsedAmount);
      if (ok) handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setMode('scan');
    setStoreName('');
    setAmount('');
    setPreviewBase64(null);
    setFile(null);
    setIsScanning(false);
    setIsSaving(false);
    onOpenChange(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContinueManually = () => {
    setMode('manual');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Add Receipt
            </DialogTitle>
          </DialogHeader>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'scan' | 'manual')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Scan (Optional)
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Enter Manually
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 [-webkit-overflow-scrolling:touch] mt-4">
              <TabsContent value="scan" className="mt-0 space-y-4">
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
                    <div className="flex gap-2">
                      <div
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Take Photo</p>
                      </div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Choose File</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
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
              </TabsContent>

              <TabsContent value="manual" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label>Receipt Photo (Optional)</Label>
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
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          if (cameraInputRef.current) cameraInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Take Photo</p>
                      </div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Choose File</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeNameManual">Store Name</Label>
                  <Input
                    id="storeNameManual"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g., Home Depot"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountManual">Total Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="amountManual"
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
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex-shrink-0 border-t border-border pt-3 mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!file || !storeName || !amount || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Receipt'}
            </Button>
          </div>
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
