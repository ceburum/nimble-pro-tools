import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { 
  CreditCard, Gift, Clock, XCircle, CheckCircle, Loader2, Search, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionOverride {
  id: string;
  user_id: string;
  user_email?: string;
  override_type: string;
  feature_name: string | null;
  is_active: boolean;
  expires_at: string | null;
  reason: string | null;
  billing_status: string;
}

interface UserOption {
  id: string;
  email: string;
}

export function AdminSubscriptionOverrides() {
  const [overrides, setOverrides] = useState<SubscriptionOverride[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<SubscriptionOverride | null>(null);
  
  const [newOverride, setNewOverride] = useState({
    userId: '',
    overrideType: 'free_access',
    featureName: 'all',
    expiresInDays: 30,
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersResponse = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });
      
      if (usersResponse.data?.users) {
        setUsers(usersResponse.data.users.map((u: any) => ({
          id: u.id,
          email: u.email
        })));
      }

      // Fetch overrides
      const { data: overridesData, error } = await supabase
        .from('subscription_overrides')
        .select('*')
        .order('granted_at', { ascending: false });

      if (error) throw error;

      // Enrich with user emails
      const enrichedOverrides = (overridesData || []).map(override => {
        const user = usersResponse.data?.users?.find((u: any) => u.id === override.user_id);
        return {
          ...override,
          user_email: user?.email || 'Unknown'
        };
      });

      setOverrides(enrichedOverrides);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantOverride = async () => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + newOverride.expiresInDays);

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('subscription_overrides')
        .upsert({
          user_id: newOverride.userId,
          override_type: newOverride.overrideType,
          feature_name: newOverride.featureName,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          reason: newOverride.reason,
          granted_by: user?.id,
          billing_status: 'active'
        }, { onConflict: 'user_id,feature_name' });

      if (error) throw error;

      toast.success('Override granted successfully');
      setShowAddDialog(false);
      setNewOverride({
        userId: '',
        overrideType: 'free_access',
        featureName: 'all',
        expiresInDays: 30,
        reason: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant override');
    }
  };

  const handleCancelOverride = async () => {
    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from('subscription_overrides')
        .update({ is_active: false, billing_status: 'canceled' })
        .eq('id', confirmCancel.id);

      if (error) throw error;

      toast.success('Override canceled');
      setConfirmCancel(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel override');
    }
  };

  const getOverrideTypeBadge = (type: string) => {
    switch (type) {
      case 'free_access': return { label: 'Free Access', variant: 'default' as const };
      case 'extended_trial': return { label: 'Extended Trial', variant: 'secondary' as const };
      case 'subscription_override': return { label: 'Subscription Override', variant: 'outline' as const };
      default: return { label: type, variant: 'outline' as const };
    }
  };

  const getBillingStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', variant: 'default' as const, className: 'bg-green-500/20 text-green-700' };
      case 'past_due': return { label: 'Past Due', variant: 'destructive' as const, className: '' };
      case 'canceled': return { label: 'Canceled', variant: 'secondary' as const, className: '' };
      default: return { label: status, variant: 'outline' as const, className: '' };
    }
  };

  const filteredOverrides = overrides.filter(o => 
    !searchQuery || o.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing Overrides
              </CardTitle>
              <CardDescription>
                Grant free access, extend trials, and manage billing status
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Grant Override
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOverrides.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No subscription overrides found</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredOverrides.map((override) => {
                const typeBadge = getOverrideTypeBadge(override.override_type);
                const statusBadge = getBillingStatusBadge(override.billing_status);
                const isExpired = override.expires_at && new Date(override.expires_at) < new Date();
                
                return (
                  <div 
                    key={override.id} 
                    className={`p-4 rounded-lg border ${!override.is_active || isExpired ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{override.user_email}</span>
                          <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                          <Badge variant={statusBadge.variant} className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                          {isExpired && <Badge variant="destructive">Expired</Badge>}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            Feature: {override.feature_name || 'All'}
                          </span>
                          {override.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {new Date(override.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {override.reason && (
                          <p className="text-xs text-muted-foreground">
                            Reason: {override.reason}
                          </p>
                        )}
                      </div>

                      {override.is_active && !isExpired && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmCancel(override)}
                          className="gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Override Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Subscription Override</DialogTitle>
            <DialogDescription>
              Grant free access, extend trials, or override subscription status for a user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select 
                value={newOverride.userId}
                onValueChange={(value) => setNewOverride(prev => ({ ...prev, userId: value }))}
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
              <Label>Override Type</Label>
              <Select 
                value={newOverride.overrideType}
                onValueChange={(value) => setNewOverride(prev => ({ ...prev, overrideType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_access">Free Access (No Charge)</SelectItem>
                  <SelectItem value="extended_trial">Extended Trial</SelectItem>
                  <SelectItem value="subscription_override">Subscription Override</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Feature</Label>
              <Select 
                value={newOverride.featureName}
                onValueChange={(value) => setNewOverride(prev => ({ ...prev, featureName: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="scheduling">Scheduling Pro</SelectItem>
                  <SelectItem value="financial">Financial Pro</SelectItem>
                  <SelectItem value="mileage">Mileage Pro</SelectItem>
                  <SelectItem value="serviceMenu">Service Menu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (Days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={newOverride.expiresInDays}
                onChange={(e) => setNewOverride(prev => ({ 
                  ...prev, 
                  expiresInDays: parseInt(e.target.value) || 30 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="Why is this override being granted?"
                value={newOverride.reason}
                onChange={(e) => setNewOverride(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrantOverride}
              disabled={!newOverride.userId}
            >
              Grant Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subscription override for <strong>{confirmCancel?.user_email}</strong>.
              They will lose access to the associated features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOverride}>
              Cancel Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
