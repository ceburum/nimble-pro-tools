import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Client1099Info } from '@/hooks/use1099Tracking';
import { TaxDisclaimer } from './TaxDisclaimer';

interface ClientTaxDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client1099Info | null;
  onSave: (updates: {
    is1099Eligible?: boolean;
    legalName?: string | null;
    tinEncrypted?: string | null;
    tinType?: 'ein' | 'ssn' | null;
    isSubcontractor?: boolean;
  }) => void;
}

export function ClientTaxDetailsDialog({
  open,
  onOpenChange,
  client,
  onSave
}: ClientTaxDetailsDialogProps) {
  const [is1099Eligible, setIs1099Eligible] = useState(false);
  const [isSubcontractor, setIsSubcontractor] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [tin, setTin] = useState('');
  const [tinType, setTinType] = useState<'ein' | 'ssn'>('ein');

  useEffect(() => {
    if (client) {
      setIs1099Eligible(client.is1099Eligible);
      setIsSubcontractor(client.isSubcontractor);
      setLegalName(client.legalName || '');
      setTin(''); // Never prefill TIN for security
      setTinType(client.tinType || 'ein');
    }
  }, [client]);

  const handleSave = () => {
    onSave({
      is1099Eligible,
      isSubcontractor,
      legalName: legalName.trim() || null,
      tinEncrypted: tin.trim() || null, // In production, encrypt before storing
      tinType: tin.trim() ? tinType : null
    });
  };

  const formatTin = (value: string, type: 'ein' | 'ssn') => {
    const digits = value.replace(/\D/g, '');
    if (type === 'ein') {
      // Format as XX-XXXXXXX
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    } else {
      // Format as XXX-XX-XXXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const handleTinChange = (value: string) => {
    setTin(formatTin(value, tinType));
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>1099 Tax Details</DialogTitle>
          <DialogDescription>
            Configure tax reporting information for {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <TaxDisclaimer variant="inline" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>1099 Eligible</Label>
              <p className="text-sm text-muted-foreground">Track payments for 1099 reporting</p>
            </div>
            <Switch
              checked={is1099Eligible}
              onCheckedChange={setIs1099Eligible}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Subcontractor</Label>
              <p className="text-sm text-muted-foreground">This is a subcontractor, not a customer</p>
            </div>
            <Switch
              checked={isSubcontractor}
              onCheckedChange={setIsSubcontractor}
            />
          </div>

          {(is1099Eligible || isSubcontractor) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Full legal name for tax forms"
                />
              </div>

              <div className="space-y-3">
                <Label>Tax ID Type</Label>
                <RadioGroup value={tinType} onValueChange={(v) => setTinType(v as 'ein' | 'ssn')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ein" id="ein" />
                    <Label htmlFor="ein" className="font-normal">EIN (Employer ID)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ssn" id="ssn" />
                    <Label htmlFor="ssn" className="font-normal">SSN (Social Security)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tin">
                  {tinType === 'ein' ? 'EIN' : 'SSN'}
                </Label>
                <Input
                  id="tin"
                  type="text"
                  value={tin}
                  onChange={(e) => handleTinChange(e.target.value)}
                  placeholder={tinType === 'ein' ? 'XX-XXXXXXX' : 'XXX-XX-XXXX'}
                  maxLength={tinType === 'ein' ? 10 : 11}
                />
                <p className="text-xs text-muted-foreground">
                  {client.tinEncrypted ? 'A TIN is already on file. Enter a new value to update.' : 'Enter to save.'}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
