import { useState } from 'react';
import { Receipt, Check } from 'lucide-react';
import { ProjectReceipt } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InvoiceReceiptSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipts: ProjectReceipt[];
  projectTitle: string;
  onConfirm: (selectedReceiptPaths: string[]) => void;
}

export function InvoiceReceiptSelectionDialog({
  open,
  onOpenChange,
  receipts,
  projectTitle,
  onConfirm,
}: InvoiceReceiptSelectionDialogProps) {
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());

  const handleToggleReceipt = (receiptId: string, storagePath: string) => {
    setSelectedReceipts((prev) => {
      const next = new Set(prev);
      if (next.has(storagePath)) {
        next.delete(storagePath);
      } else {
        next.add(storagePath);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedReceipts.size === receipts.length) {
      setSelectedReceipts(new Set());
    } else {
      // Get storage paths from dataUrl (which contains the path for DB receipts)
      setSelectedReceipts(new Set(receipts.map((r) => r.dataUrl)));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedReceipts));
    setSelectedReceipts(new Set());
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm([]);
    setSelectedReceipts(new Set());
    onOpenChange(false);
  };

  const totalSelected = receipts
    .filter((r) => selectedReceipts.has(r.dataUrl))
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Attach Receipts to Invoice
          </DialogTitle>
          <DialogDescription>
            Select which receipts from "{projectTitle}" to include with the invoice email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No receipts available for this project</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedReceipts.size === receipts.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedReceipts.size} of {receipts.length} selected
                </span>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {receipts.map((receipt) => {
                    const isSelected = selectedReceipts.has(receipt.dataUrl);
                    return (
                      <div
                        key={receipt.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => handleToggleReceipt(receipt.id, receipt.dataUrl)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleReceipt(receipt.id, receipt.dataUrl)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{receipt.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="font-semibold text-sm">${receipt.amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {selectedReceipts.size > 0 && (
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Selected total:</span>
                  <span className="font-bold">${totalSelected.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip Receipts
            </Button>
            <Button onClick={handleConfirm} disabled={receipts.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              {selectedReceipts.size > 0
                ? `Attach ${selectedReceipts.size} Receipt${selectedReceipts.size > 1 ? 's' : ''}`
                : 'Create Without Receipts'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
