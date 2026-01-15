import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Settings, AlertTriangle, Loader2, Save, Power, UserPlus, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  signups_enabled: boolean;
  force_update_version: string | null;
}

export function AdminGlobalSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'maintenance' | 'signups' | null;
    newValue: boolean;
  }>({ open: false, action: null, newValue: false });

  const [formData, setFormData] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    signups_enabled: true,
    force_update_version: ''
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_app_settings')
        .select('*')
        .single();

      if (error) throw error;
      
      setSettings(data);
      setFormData({
        maintenance_mode: data.maintenance_mode,
        maintenance_message: data.maintenance_message || '',
        signups_enabled: data.signups_enabled,
        force_update_version: data.force_update_version || ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_app_settings')
        .update({
          maintenance_mode: formData.maintenance_mode,
          maintenance_message: formData.maintenance_message || null,
          signups_enabled: formData.signups_enabled,
          force_update_version: formData.force_update_version || null,
          updated_by: user?.id
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleWithConfirm = (action: 'maintenance' | 'signups', newValue: boolean) => {
    setConfirmDialog({ open: true, action, newValue });
  };

  const confirmToggle = () => {
    if (confirmDialog.action === 'maintenance') {
      setFormData(prev => ({ ...prev, maintenance_mode: confirmDialog.newValue }));
    } else if (confirmDialog.action === 'signups') {
      setFormData(prev => ({ ...prev, signups_enabled: confirmDialog.newValue }));
    }
    setConfirmDialog({ open: false, action: null, newValue: false });
  };

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Global App Settings
            </CardTitle>
            <CardDescription>
              Admin-only settings that affect the entire application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-primary/30 bg-primary/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Changes to these settings affect all users immediately. Use with caution.
              </AlertDescription>
            </Alert>

            {/* Maintenance Mode */}
            <div className="space-y-4 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-base">
                    <Power className="h-4 w-4" />
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users will see a maintenance message instead of the app
                  </p>
                </div>
                <Switch
                  checked={formData.maintenance_mode}
                  onCheckedChange={(checked) => handleToggleWithConfirm('maintenance', checked)}
                />
              </div>

              {formData.maintenance_mode && (
                <div className="space-y-2">
                  <Label>Maintenance Message</Label>
                  <Textarea
                    placeholder="We're performing scheduled maintenance. Please check back soon."
                    value={formData.maintenance_message}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maintenance_message: e.target.value 
                    }))}
                  />
                </div>
              )}
            </div>

            {/* Signups Enabled */}
            <div className="space-y-4 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-base">
                    <UserPlus className="h-4 w-4" />
                    New Signups
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register for accounts
                  </p>
                </div>
                <Switch
                  checked={formData.signups_enabled}
                  onCheckedChange={(checked) => handleToggleWithConfirm('signups', checked)}
                />
              </div>
            </div>

            {/* Force Update Version */}
            <div className="space-y-4 p-4 rounded-lg border">
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-4 w-4" />
                  Force App Update
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set a minimum version. Users on older versions will be prompted to update.
                </p>
              </div>
              <Input
                placeholder="e.g. 1.5.0"
                value={formData.force_update_version}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  force_update_version: e.target.value 
                }))}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'maintenance' && (
                confirmDialog.newValue 
                  ? 'Enable Maintenance Mode?' 
                  : 'Disable Maintenance Mode?'
              )}
              {confirmDialog.action === 'signups' && (
                confirmDialog.newValue 
                  ? 'Enable New Signups?' 
                  : 'Disable New Signups?'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'maintenance' && confirmDialog.newValue && (
                <span>All users will be blocked from accessing the app until maintenance mode is disabled.</span>
              )}
              {confirmDialog.action === 'maintenance' && !confirmDialog.newValue && (
                <span>Users will be able to access the app again.</span>
              )}
              {confirmDialog.action === 'signups' && !confirmDialog.newValue && (
                <span>New users will not be able to register. Existing users can still sign in.</span>
              )}
              {confirmDialog.action === 'signups' && confirmDialog.newValue && (
                <span>New users will be able to register for accounts.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
