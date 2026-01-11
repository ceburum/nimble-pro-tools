import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Package } from 'lucide-react';
import { useMaterials, Material, MaterialInput } from '@/hooks/useMaterials';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { MaterialDialog } from '@/components/materials/MaterialDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Materials() {
  const { materials, loading, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (input: MaterialInput) => {
    if (editingMaterial) {
      return updateMaterial(editingMaterial.id, input);
    } else {
      return addMaterial(input);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingMaterial(undefined);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteMaterial(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materials"
        description="Manage your material prices for quick quote estimates"
        action={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No materials yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your commonly used materials with prices for quick quote estimates.
          </p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Material
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onEdit={handleEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editingMaterial}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
