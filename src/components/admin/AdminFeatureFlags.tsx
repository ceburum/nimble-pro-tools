import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Flag, Plus, Loader2, Globe, User, Trash2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
}

interface UserFlag {
  id: string;
  user_id: string;
  user_email?: string;
  flag_name: string;
  is_enabled: boolean;
  expires_at: string | null;
  reason: string | null;
}

interface UserOption {
  id: string;
  email: string;
}

export function AdminFeatureFlags() {
  const [globalFlags, setGlobalFlags] = useState<GlobalFlag[]>([]);
  const [userFlags, setUserFlags] = useState<UserFlag[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddGlobalDialog, setShowAddGlobalDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  
  const [newGlobalFlag, setNewGlobalFlag] = useState({
    flagName: '',
    description: '',
    isEnabled: false
  });

  const [newUserFlag, setNewUserFlag] = useState({
    userId: '',
    flagName: '',
    isEnabled: true,
    expiresInDays: 0,
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch global flags
      const { data: globalData, error: globalError } = await supabase
        .from('global_feature_flags')
        .select('*')
        .order('flag_name');

      if (globalError) throw globalError;
      setGlobalFlags(globalData || []);

      // Fetch user flags
      const { data: userFlagsData, error: userError } = await supabase
        .from('user_feature_flags')
        .select('*')
        .order('granted_at', { ascending: false });

      if (userError) throw userError;

      // Fetch users for enrichment
      const usersResponse = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });

      if (usersResponse.data?.users) {
        setUsers(usersResponse.data.users.map((u: any) => ({
          id: u.id,
          email: u.email
        })));

        // Enrich user flags with emails
        const enrichedUserFlags = (userFlagsData || []).map(flag => {
          const user = usersResponse.data.users.find((u: any) => u.id === flag.user_id);
          return {
            ...flag,
            user_email: user?.email || 'Unknown'
          };
        });
        setUserFlags(enrichedUserFlags);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleGlobalFlag = async (flag: GlobalFlag) => {
    try {
      const { error } = await supabase
        .from('global_feature_flags')
        .update({ is_enabled: !flag.is_enabled })
        .eq('id', flag.id);

      if (error) throw error;
      
      toast.success(`Flag "${flag.flag_name}" ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update flag');
    }
  };

  const handleAddGlobalFlag = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('global_feature_flags')
        .insert({
          flag_name: newGlobalFlag.flagName,
          description: newGlobalFlag.description || null,
          is_enabled: newGlobalFlag.isEnabled,
          updated_by: user?.id
        });

      if (error) throw error;

      toast.success('Global flag created');
      setShowAddGlobalDialog(false);
      setNewGlobalFlag({ flagName: '', description: '', isEnabled: false });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create flag');
    }
  };

  const handleAddUserFlag = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const expiresAt = newUserFlag.expiresInDays > 0 
        ? new Date(Date.now() + newUserFlag.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('user_feature_flags')
        .upsert({
          user_id: newUserFlag.userId,
          flag_name: newUserFlag.flagName,
          is_enabled: newUserFlag.isEnabled,
          expires_at: expiresAt,
          reason: newUserFlag.reason || null,
          granted_by: user?.id
        }, { onConflict: 'user_id,flag_name' });

      if (error) throw error;

      toast.success('User flag created');
      setShowAddUserDialog(false);
      setNewUserFlag({ userId: '', flagName: '', isEnabled: true, expiresInDays: 0, reason: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user flag');
    }
  };

  const handleDeleteGlobalFlag = async (flag: GlobalFlag) => {
    try {
      const { error } = await supabase
        .from('global_feature_flags')
        .delete()
        .eq('id', flag.id);

      if (error) throw error;
      
      toast.success(`Flag "${flag.flag_name}" deleted`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete flag');
    }
  };

  const handleDeleteUserFlag = async (flag: UserFlag) => {
    try {
      const { error } = await supabase
        .from('user_feature_flags')
        .delete()
        .eq('id', flag.id);

      if (error) throw error;
      
      toast.success('User flag deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete flag');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Global Feature Flags */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Feature Flags
                </CardTitle>
                <CardDescription>
                  Enable/disable features for all users. Flags default to off.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddGlobalDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Flag
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : globalFlags.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No global flags configured</p>
            ) : (
              <div className="space-y-3">
                {globalFlags.map((flag) => (
                  <div 
                    key={flag.id} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{flag.flag_name}</span>
                        <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                          {flag.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => handleToggleGlobalFlag(flag)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGlobalFlag(flag)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-User Feature Flags */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Per-User Feature Flags
                </CardTitle>
                <CardDescription>
                  Enable beta features or experimental tools for specific users
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddUserDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add User Flag
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userFlags.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No per-user flags configured</p>
            ) : (
              <div className="space-y-3">
                {userFlags.map((flag) => {
                  const isExpired = flag.expires_at && new Date(flag.expires_at) < new Date();
                  
                  return (
                    <div 
                      key={flag.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${isExpired ? 'opacity-50' : ''}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{flag.user_email}</span>
                          <Badge variant="outline">{flag.flag_name}</Badge>
                          <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                            {flag.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {isExpired && <Badge variant="destructive">Expired</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {flag.expires_at && (
                            <span>Expires: {new Date(flag.expires_at).toLocaleDateString()}</span>
                          )}
                          {flag.reason && <span>Reason: {flag.reason}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUserFlag(flag)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Global Flag Dialog */}
      <Dialog open={showAddGlobalDialog} onOpenChange={setShowAddGlobalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Global Feature Flag</DialogTitle>
            <DialogDescription>
              Create a new feature flag that applies to all users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Flag Name</Label>
              <Input
                placeholder="e.g. new_dashboard_ui"
                value={newGlobalFlag.flagName}
                onChange={(e) => setNewGlobalFlag(prev => ({ ...prev, flagName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this flag control?"
                value={newGlobalFlag.description}
                onChange={(e) => setNewGlobalFlag(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newGlobalFlag.isEnabled}
                onCheckedChange={(checked) => setNewGlobalFlag(prev => ({ ...prev, isEnabled: checked }))}
              />
              <Label>Enable by default</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGlobalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddGlobalFlag}
              disabled={!newGlobalFlag.flagName.trim()}
            >
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Flag Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User Feature Flag</DialogTitle>
            <DialogDescription>
              Enable a feature for a specific user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select 
                value={newUserFlag.userId}
                onValueChange={(value) => setNewUserFlag(prev => ({ ...prev, userId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Flag Name</Label>
              <Input
                placeholder="e.g. beta_ai_features"
                value={newUserFlag.flagName}
                onChange={(e) => setNewUserFlag(prev => ({ ...prev, flagName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Expires In (Days, 0 = never)</Label>
              <Input
                type="number"
                min={0}
                value={newUserFlag.expiresInDays}
                onChange={(e) => setNewUserFlag(prev => ({ 
                  ...prev, 
                  expiresInDays: parseInt(e.target.value) || 0 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="Why is this flag being enabled?"
                value={newUserFlag.reason}
                onChange={(e) => setNewUserFlag(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUserFlag}
              disabled={!newUserFlag.userId || !newUserFlag.flagName.trim()}
            >
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
