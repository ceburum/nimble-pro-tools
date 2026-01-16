import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Menu, Briefcase, Edit2, Save, Loader2, RefreshCw,
  LayoutDashboard, Users, FolderOpen, FileText, Calendar, Settings, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface Profession {
  id: string;
  slug: string;
  display_name: string;
  icon: string;
  business_type: string;
  is_active: boolean;
}

interface MenuConfigItem {
  id: string;
  profession_id: string | null;
  menu_item_key: string;
  menu_label: string;
  default_label: string;
  is_enabled: boolean;
  display_order: number;
  icon_name: string | null;
  route_path: string | null;
}

export function AdminMenuProfessionConfig() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [menuConfig, setMenuConfig] = useState<MenuConfigItem[]>([]);
  const [selectedProfession, setSelectedProfession] = useState<string>('global');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuConfigItem | null>(null);
  const [editForm, setEditForm] = useState({
    menu_label: '',
    is_enabled: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [professionsRes, menuRes] = await Promise.all([
        supabase.from('professions').select('*').eq('is_active', true).order('display_name'),
        supabase.from('profession_menu_config').select('*').order('display_order')
      ]);

      if (professionsRes.error) throw professionsRes.error;
      if (menuRes.error) throw menuRes.error;

      setProfessions(professionsRes.data || []);
      setMenuConfig(menuRes.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMenuItemsForProfession = () => {
    if (selectedProfession === 'global') {
      return menuConfig.filter(item => item.profession_id === null);
    }
    
    // Get profession-specific items, or fall back to global
    const professionItems = menuConfig.filter(item => item.profession_id === selectedProfession);
    if (professionItems.length > 0) {
      return professionItems;
    }
    
    // Return global items as template
    return menuConfig.filter(item => item.profession_id === null);
  };

  const handleEditClick = (item: MenuConfigItem) => {
    setEditingItem(item);
    setEditForm({
      menu_label: item.menu_label,
      is_enabled: item.is_enabled
    });
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profession_menu_config')
        .update({
          menu_label: editForm.menu_label,
          is_enabled: editForm.is_enabled
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Menu item updated');
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (item: MenuConfigItem) => {
    try {
      const { error } = await supabase
        .from('profession_menu_config')
        .update({ is_enabled: !item.is_enabled })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`${item.menu_label} ${!item.is_enabled ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update menu item');
    }
  };

  const displayItems = getMenuItemsForProfession();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Profession List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professions
                </CardTitle>
                <CardDescription>
                  {professions.length} active professions in the system
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {professions.map(profession => (
                <Badge 
                  key={profession.id} 
                  variant="outline"
                  className="gap-1.5 py-1.5 px-3"
                >
                  <DynamicIcon name={profession.icon} className="h-3.5 w-3.5" />
                  {profession.display_name}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({profession.business_type === 'mobile_job' ? 'Mobile' : 'Stationary'})
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  Menu Configuration
                </CardTitle>
                <CardDescription>
                  Configure which menu items appear for each profession
                </CardDescription>
              </div>
              
              <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (Default)</SelectItem>
                  <Separator className="my-1" />
                  {professions.map(profession => (
                    <SelectItem key={profession.id} value={profession.id}>
                      {profession.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No menu configuration found. Using default menu.
              </p>
            ) : (
              displayItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <DynamicIcon 
                      name={item.icon_name || 'Circle'} 
                      className="h-5 w-5 text-muted-foreground shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${!item.is_enabled ? 'text-muted-foreground line-through' : ''}`}>
                          {item.menu_label}
                        </span>
                        {item.menu_label !== item.default_label && (
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.route_path}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_enabled}
                      onCheckedChange={() => handleToggleEnabled(item)}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditClick(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            {selectedProfession !== 'global' && displayItems.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-4">
                Showing {selectedProfession === 'global' ? 'global default' : 'inherited global'} configuration.
                Edit items to create profession-specific overrides.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_enabled">Visible in Menu</Label>
              <Switch
                id="is_enabled"
                checked={editForm.is_enabled}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_enabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu_label">Menu Label</Label>
              <Input
                id="menu_label"
                value={editForm.menu_label}
                onChange={(e) => setEditForm(prev => ({ ...prev, menu_label: e.target.value }))}
                placeholder="Menu item label"
              />
              <p className="text-xs text-muted-foreground">
                Default: {editingItem?.default_label}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}