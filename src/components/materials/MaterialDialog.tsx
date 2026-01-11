import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScanBarcode } from 'lucide-react';
import { Material, MaterialInput } from '@/hooks/useMaterials';
import { BarcodeScannerDialog } from './BarcodeScannerDialog';

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
  onSave: (input: MaterialInput) => Promise<boolean | Material | null>;
}

const UNIT_OPTIONS = [
  { value: 'each', label: 'Each' },
  { value: 'linear ft', label: 'Linear Foot' },
  { value: 'sq ft', label: 'Square Foot' },
  { value: 'cu ft', label: 'Cubic Foot' },
  { value: 'board ft', label: 'Board Foot' },
  { value: 'lb', label: 'Pound' },
  { value: 'ton', label: 'Ton' },
  { value: 'gallon', label: 'Gallon' },
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'roll', label: 'Roll' },
];

const CATEGORY_OPTIONS = [
  'Lumber',
  'Plywood & Panels',
  'Fasteners',
  'Concrete & Masonry',
  'Roofing',
  'Siding',
  'Insulation',
  'Drywall',
  'Paint & Finishes',
  'Plumbing',
  'Electrical',
  'Hardware',
  'Tools',
  'Other',
];

export function MaterialDialog({
  open,
  onOpenChange,
  material,
  onSave,
}: MaterialDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('each');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [sku, setSku] = useState('');
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setUnit('each');
    setUnitPrice('');
    setCategory('');
    setSupplier('');
    setSku('');
  };

  useEffect(() => {
    if (open) {
      if (material) {
        setName(material.name);
        setDescription(material.description || '');
        setUnit(material.unit);
        setUnitPrice(material.unitPrice.toString());
        setCategory(material.category || '');
        setSupplier(material.supplier || '');
        setSku(material.sku || '');
      } else {
        resetForm();
      }
    }
  }, [open, material]);

  const handleScanResult = (data: {
    barcode: string;
    name?: string;
    description?: string;
    category?: string;
    supplier?: string;
  }) => {
    // Auto-populate fields from scan
    if (data.name) setName(data.name);
    if (data.description) setDescription(data.description);
    if (data.category && CATEGORY_OPTIONS.includes(data.category)) {
      setCategory(data.category);
    }
    if (data.supplier) setSupplier(data.supplier);
    // Store the barcode as SKU
    setSku(data.barcode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setSaving(true);
    const result = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      unit,
      unitPrice: parseFloat(unitPrice) || 0,
      category: category || undefined,
      supplier: supplier.trim() || undefined,
      sku: sku.trim() || undefined,
    });
    setSaving(false);

    if (result !== false && result !== null) {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{material ? 'Edit Material' : 'Add Material'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Scan Barcode Button - only show when adding new material */}
            {!material && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setScannerOpen(true)}
              >
                <ScanBarcode className="h-4 w-4 mr-2" />
                Scan Barcode to Auto-Fill
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 2x4x8 Stud"
                required
              />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g., Home Depot"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : material ? 'Update' : 'Add'}
            </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanResult}
      />
    </>
  );
}
