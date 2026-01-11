import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Plus, Search } from 'lucide-react';
import { Material } from '@/hooks/useMaterials';

interface MaterialPickerProps {
  materials: Material[];
  onSelect: (material: Material, quantity: number) => void;
  onAddNew?: () => void;
}

export function MaterialPicker({ materials, onSelect, onAddNew }: MaterialPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState<{ [key: string]: number }>({});

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (material: Material) => {
    const qty = quantity[material.id] || 1;
    onSelect(material, qty);
    setOpen(false);
    setSearch('');
    setQuantity({});
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Package className="h-4 w-4 mr-1" />
          Add Material
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          {filteredMaterials.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {materials.length === 0 ? (
                <div className="space-y-2">
                  <p>No materials saved yet</p>
                  {onAddNew && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        onAddNew();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add First Material
                    </Button>
                  )}
                </div>
              ) : (
                'No materials found'
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => handleSelect(material)}
                  >
                    <p className="font-medium text-sm truncate">{material.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${material.unitPrice.toFixed(2)} / {material.unit}
                      {material.category && ` · ${material.category}`}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={quantity[material.id] || 1}
                    onChange={(e) =>
                      setQuantity((prev) => ({
                        ...prev,
                        [material.id]: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-16 h-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleSelect(material)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {onAddNew && materials.length > 0 && (
          <div className="p-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Material
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
