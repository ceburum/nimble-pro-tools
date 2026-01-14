import { useState } from 'react';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, Building, Bell, Palette, Shield, Package, 
  Moon, Sun, Monitor, MapPin, HardDrive, Cloud,
  Mail, MessageSquare, Calendar, Lock, Sparkles, Check
} from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useAppState } from '@/hooks/useAppState';
import { AppState } from '@/lib/appState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminStateSimulator } from '@/components/settings/AdminStateSimulator';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { profile, loading: profileLoading, updateProfile } = useBusinessProfile();
  const { state, isAdmin, hasAccess, setupProgress, capabilities } = useAppState();
  
  const [isSaving, setIsSaving] = useState(false);
  const [businessName, setBusinessName] = useState(profile?.companyName || '');
  const [businessEmail, setBusinessEmail] = useState(profile?.companyEmail || '');
  const [businessPhone, setBusinessPhone] = useState(profile?.companyPhone || '');
  const [businessAddress, setBusinessAddress] = useState(profile?.companyAddress || '');
  
  // Notification preferences (local state for now)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  
  // Permission states
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');

  // Update local state when profile loads
  useState(() => {
    if (profile) {
      setBusinessName(profile.companyName || '');
      setBusinessEmail(profile.companyEmail || '');
      setBusinessPhone(profile.companyPhone || '');
      setBusinessAddress(profile.companyAddress || '');
    }
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        companyName: businessName,
        companyEmail: businessEmail,
        companyPhone: businessPhone,
        companyAddress: businessAddress,
      });
      toast.success('Profile saved');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (result.state === 'granted') {
        setLocationEnabled(true);
        toast.success('Location access granted');
      } else if (result.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationEnabled(true);
            toast.success('Location access granted');
          },
          () => {
            toast.error('Location access denied');
          }
        );
      } else {
        toast.error('Location access denied. Please enable in browser settings.');
      }
    } catch (error) {
      toast.error('Could not request location permission');
    }
  };

  const handlePasswordReset = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error('No email found');
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) {
      toast.error('Failed to send reset email');
    } else {
      toast.success('Password reset email sent');
    }
  };

  const getAddOnStatus = (featureKey: string) => {
    const isActive = hasAccess(featureKey as any);
    if (state === AppState.ADMIN_PREVIEW) return { status: 'Admin Preview', variant: 'default' as const };
    if (state === AppState.PAID_PRO && isActive) return { status: 'Active', variant: 'default' as const };
    if (state === AppState.TRIAL_PRO && isActive) return { status: 'Trial', variant: 'secondary' as const };
    return { status: 'Locked', variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences, and permissions"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:inline" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:inline" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:inline" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:inline" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="addons" className="gap-2">
            <Package className="h-4 w-4 hidden sm:inline" />
            Add-ons
          </TabsTrigger>
        </TabsList>

        {/* Profile & Business Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Your business details shown on invoices and quotes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="email@business.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Send a password reset link to your email
                  </p>
                </div>
                <Button variant="outline" onClick={handlePasswordReset}>
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin State Simulator - only for admins */}
          {isAdmin && <AdminStateSimulator />}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get text message alerts (coming soon)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                  disabled
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Calendar Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Sync appointments to your calendar (coming soon)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={calendarSync}
                  onCheckedChange={setCalendarSync}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
              <CardDescription>
                Choose your preferred color scheme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'light' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-sm font-medium">Light</span>
                  {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-sm font-medium">Dark</span>
                  {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                </button>

                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'system' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-sm font-medium">System</span>
                  {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Access
              </CardTitle>
              <CardDescription>
                Required only for Mileage Pro GPS tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">GPS Location</p>
                  <p className="text-sm text-muted-foreground">
                    Enable for automatic mileage tracking
                  </p>
                </div>
                {locationEnabled ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleRequestLocationPermission}
                    disabled={!hasAccess('mileage')}
                  >
                    {hasAccess('mileage') ? 'Enable' : 'Requires Mileage Pro'}
                  </Button>
                )}
              </div>
              {!hasAccess('mileage') && (
                <p className="text-xs text-muted-foreground">
                  Location permission is only requested when Mileage Pro is active.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Data Storage
              </CardTitle>
              <CardDescription>
                Choose where your data is stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setStorageMode('local')}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    storageMode === 'local' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <HardDrive className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Device Storage</p>
                    <p className="text-sm text-muted-foreground">
                      Free • Data stays on this device
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setStorageMode('cloud')}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    storageMode === 'cloud' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Cloud className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      Cloud Storage
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      $2.99/mo • Sync across devices
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add-ons Overview Tab */}
        <TabsContent value="addons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Add-ons
              </CardTitle>
              <CardDescription>
                Overview of your active features and add-ons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'scheduling', name: 'Scheduling Pro', description: 'Calendar management & auto-notifications' },
                { key: 'financial', name: 'Financial Pro', description: 'Advanced reports & AI reconciliation' },
                { key: 'mileage', name: 'Mileage Pro', description: 'GPS tracking for tax deductions' },
                { key: 'serviceMenu', name: 'Service Menu', description: 'Custom service listings' },
              ].map((addon) => {
                const status = getAddOnStatus(addon.key);
                return (
                  <div key={addon.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        <p className="text-sm text-muted-foreground">{addon.description}</p>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.status}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
