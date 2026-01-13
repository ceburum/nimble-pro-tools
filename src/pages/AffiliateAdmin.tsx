import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAffiliateAdmin } from '@/hooks/useAffiliateAdmin';
import { PendingApplicationsTable } from '@/components/affiliates/PendingApplicationsTable';
import { 
  Settings, 
  Users, 
  DollarSign, 
  Plus,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function AffiliateAdmin() {
  const {
    loading,
    isAdmin,
    affiliates,
    settings,
    updateSettings,
    increaseLimit,
    updateAffiliate,
    processPayout,
    fetchAffiliates,
  } = useAffiliateAdmin();

  const [payoutDialog, setPayoutDialog] = useState<{ open: boolean; affiliateId: string; maxAmount: number }>({
    open: false,
    affiliateId: '',
    maxAmount: 0,
  });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the salesperson admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleToggleSignups = async () => {
    if (settings) {
      await updateSettings({ signups_enabled: !settings.signups_enabled });
    }
  };

  const handleIncreaseLimit = async () => {
    await increaseLimit(25);
  };

  const handleOpenPayoutDialog = (affiliateId: string, pendingAmount: number) => {
    setPayoutDialog({ open: true, affiliateId, maxAmount: pendingAmount });
    setPayoutAmount(pendingAmount.toFixed(2));
  };

  const handleProcessPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setProcessingPayout(true);
    await processPayout(payoutDialog.affiliateId, amount);
    setProcessingPayout(false);
    setPayoutDialog({ open: false, affiliateId: '', maxAmount: 0 });
    setPayoutAmount('');
  };

  const handleApproveApplication = async (affiliateId: string) => {
    await updateAffiliate(affiliateId, { status: 'active' as any });
    await fetchAffiliates();
  };

  const handleRejectApplication = async (affiliateId: string, reason: string) => {
    await updateAffiliate(affiliateId, { 
      status: 'rejected' as any,
      rejection_reason: reason,
    } as any);
    await fetchAffiliates();
  };

  const handleUpdateStatus = async (affiliateId: string, status: string) => {
    await updateAffiliate(affiliateId, { status: status as any });
  };

  const pendingApplications = affiliates.filter(a => a.status === 'pending');
  const activeAffiliates = affiliates.filter(a => a.status === 'active');
  const allNonPending = affiliates.filter(a => a.status !== 'pending');
  const totalPending = affiliates.reduce((sum, a) => sum + (a.pending_earnings || 0), 0);
  const totalPaid = affiliates.reduce((sum, a) => sum + (a.total_earnings || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Salesperson Admin</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Salespeople</CardDescription>
            <CardTitle className="text-3xl">{affiliates.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {activeAffiliates.length} active · {pendingApplications.length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Salesperson Limit</CardDescription>
            <CardTitle className="text-3xl">
              {settings?.current_affiliates || 0} / {settings?.max_affiliates || 25}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={handleIncreaseLimit}>
              <Plus className="h-4 w-4 mr-1" />
              Add 25 More
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payouts</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              ${totalPending.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Paid Out</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${totalPaid.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Program Settings</CardTitle>
          <CardDescription>Control salesperson program availability and defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Accept New Applications</Label>
              <p className="text-sm text-muted-foreground">
                {settings?.signups_enabled ? 'Applications are open' : 'Applications are paused'}
              </p>
            </div>
            <Switch
              checked={settings?.signups_enabled || false}
              onCheckedChange={handleToggleSignups}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
            <div>
              <Label>Default Commission Rate</Label>
              <p className="text-lg font-semibold">
                {((settings?.default_commission_rate || 0.1) * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <Label>Commission Type</Label>
              <p className="text-lg font-semibold capitalize">
                {settings?.default_commission_type || 'percentage'}
              </p>
            </div>
            <div>
              <Label>Min Payout Threshold</Label>
              <p className="text-lg font-semibold">
                ${(settings?.min_payout_threshold || 25).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Pending vs All */}
      <Tabs defaultValue={pendingApplications.length > 0 ? "pending" : "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <FileText className="h-4 w-4" />
            Pending Applications
            {pendingApplications.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingApplications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Salespeople
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingApplicationsTable
            applications={pendingApplications}
            onApprove={handleApproveApplication}
            onReject={handleRejectApplication}
          />
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Salespeople
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allNonPending.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No salespeople yet. Pending applications will appear in the other tab.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allNonPending.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell className="font-mono">{affiliate.referral_code}</TableCell>
                        <TableCell>
                          <Badge variant={
                            affiliate.status === 'active' ? 'default' :
                            affiliate.status === 'paused' ? 'outline' : 'destructive'
                          }>
                            {affiliate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{affiliate.total_referrals}</TableCell>
                        <TableCell className="text-yellow-600">
                          ${(affiliate.pending_earnings || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          ${(affiliate.total_earnings || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(affiliate.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {affiliate.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(affiliate.id, 'paused')}
                              >
                                Pause
                              </Button>
                            )}
                            {affiliate.status === 'paused' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(affiliate.id, 'active')}
                              >
                                Reactivate
                              </Button>
                            )}
                            {(affiliate.pending_earnings || 0) >= (settings?.min_payout_threshold || 25) && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenPayoutDialog(affiliate.id, affiliate.pending_earnings || 0)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Payout
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Dialog */}
      <Dialog open={payoutDialog.open} onOpenChange={(open) => setPayoutDialog({ ...payoutDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Enter the amount to pay out to this salesperson. Maximum: ${payoutDialog.maxAmount.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Payout Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                max={payoutDialog.maxAmount}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog({ open: false, affiliateId: '', maxAmount: 0 })}>
              Cancel
            </Button>
            <Button onClick={handleProcessPayout} disabled={processingPayout}>
              {processingPayout ? 'Processing...' : 'Send Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
