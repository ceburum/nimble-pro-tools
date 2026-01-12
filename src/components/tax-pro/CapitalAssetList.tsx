import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useCapitalAssets, CapitalAsset } from '@/hooks/useCapitalAssets';
import { TaxDisclaimer } from './TaxDisclaimer';
import { Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function CapitalAssetList() {
  const { assets, loading, addAsset, deleteAsset, totalAssetValue } = useCapitalAssets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [cost, setCost] = useState('');
  const [assetType, setAssetType] = useState<CapitalAsset['assetType']>('equipment');
  const [notes, setNotes] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const resetForm = () => {
    setDescription('');
    setPurchaseDate('');
    setCost('');
    setAssetType('equipment');
    setNotes('');
  };

  const handleAdd = async () => {
    if (!description.trim() || !purchaseDate || !cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await addAsset({
      description: description.trim(),
      purchaseDate: new Date(purchaseDate),
      cost: parseFloat(cost),
      assetType,
      depreciationHint: null,
      notes: notes.trim() || null,
      receiptId: null
    });

    if (result) {
      toast.success('Capital asset added');
      setDialogOpen(false);
      resetForm();
    } else {
      toast.error('Failed to add capital asset');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteAsset(id);
    if (success) {
      toast.success('Asset removed');
    } else {
      toast.error('Failed to remove asset');
    }
  };

  const getDepreciationLabel = (hint: CapitalAsset['depreciationHint']) => {
    if (hint === 'section_179_candidate') {
      return { text: 'Section 179 Candidate', variant: 'default' as const };
    }
    if (hint === 'likely_depreciable') {
      return { text: 'Likely Depreciable', variant: 'secondary' as const };
    }
    return null;
  };

  const getAssetTypeLabel = (type: CapitalAsset['assetType']) => {
    const labels: Record<CapitalAsset['assetType'], string> = {
      equipment: 'Equipment',
      vehicle: 'Vehicle',
      tools: 'Tools',
      other: 'Other'
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaxDisclaimer variant="card" />

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Total Asset Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} tracked
          </p>
        </CardContent>
      </Card>

      {/* Add Asset Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Capital Asset
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Capital Asset</DialogTitle>
            <DialogDescription>
              Track equipment, vehicles, or tools for tax organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., DeWalt Table Saw"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Select value={assetType} onValueChange={(v) => setAssetType(v as CapitalAsset['assetType'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Serial number, warranty info, etc."
                rows={2}
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Assets over $2,500 may be depreciable. Equipment and vehicles may qualify for Section 179. 
                  Consult your tax professional.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset List */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No capital assets tracked yet.</p>
            <p className="text-sm mt-2">Add equipment, vehicles, or tools to track for tax purposes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const label = getDepreciationLabel(asset.depreciationHint);
            return (
              <Card key={asset.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{asset.description}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getAssetTypeLabel(asset.assetType)}
                        </Badge>
                        {label && (
                          <Badge variant={label.variant} className="text-xs">
                            {label.text}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4">
                        <span>Purchased: {format(asset.purchaseDate, 'MMM d, yyyy')}</span>
                        <span className="font-medium text-foreground">{formatCurrency(asset.cost)}</span>
                      </div>
                      {asset.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{asset.notes}</p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
