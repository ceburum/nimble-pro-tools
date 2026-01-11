import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Package } from 'lucide-react';
import { Material } from '@/hooks/useMaterials';

interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
}

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{material.name}</h3>
              <p className="text-lg font-bold text-primary">
                ${material.unitPrice.toFixed(2)}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  / {material.unit}
                </span>
              </p>
              {material.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {material.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {material.category && (
                  <Badge variant="secondary">{material.category}</Badge>
                )}
                {material.supplier && (
                  <Badge variant="outline">{material.supplier}</Badge>
                )}
                {material.sku && (
                  <span className="text-xs text-muted-foreground">SKU: {material.sku}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(material)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(material.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
