import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DismissibleBanner } from '@/components/ui/dismissible-banner';
import { useAffiliate } from '@/hooks/useAffiliate';
import { 
  Users, 
  DollarSign, 
  Link, 
  ExternalLink, 
  Copy, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

export default function Affiliates() {
  const [searchParams] = useSearchParams();
  const {
    loading,
    isAffiliate,
    affiliate,
    referrals,
    payouts,
    settings,
    checkAffiliateStatus,
    startOnboarding,
    openStripeDashboard,
    getReferralLink,
    copyReferralLink,
  } = useAffiliate();

  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    // Check for onboarding complete or refresh
    if (searchParams.get('onboarding') === 'complete' || searchParams.get('refresh') === 'true') {
      checkAffiliateStatus();
    }
  }, [searchParams, checkAffiliateStatus]);

  const handleStartOnboarding = async () => {
    setOnboardingLoading(true);
    const url = await startOnboarding();
    if (url) {
      window.location.href = url;
    }
    setOnboardingLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      paused: { variant: 'outline', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    };
    const { variant, icon } = variants[status] || variants.pending;
    return (
      <Badge variant={variant} className="capitalize flex items-center">
        {icon}
        {status}
      </Badge>
    );
  };

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

  // Not yet an affiliate - show signup
  if (!isAffiliate) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Affiliate Program</h1>
        </div>

        {settings && !settings.signupsEnabled && (
          <DismissibleBanner
            storageKey="affiliate-closed"
            variant="warning"
            className="mb-4"
          >
            Affiliate signups are temporarily paused. Check back later!
          </DismissibleBanner>
        )}

        {settings && settings.currentAffiliates >= settings.maxAffiliates && (
          <DismissibleBanner
            storageKey="affiliate-full"
            variant="warning"
            className="mb-4"
          >
            We've reached our current affiliate limit. More spots opening soon!
          </DismissibleBanner>
        )}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Become a Sidecar Affiliate</CardTitle>
            <CardDescription>
              Earn commissions by referring new users to Sidecar. Share your unique link and earn on every paid subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Earn 10% Commission</h3>
                  <p className="text-sm text-muted-foreground">On all paid features purchased through your link</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Stripe Handles Payouts</h3>
                  <p className="text-sm text-muted-foreground">We never collect your banking info</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Link className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Unique Referral Link</h3>
                  <p className="text-sm text-muted-foreground">Track all your referrals in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Transparent Dashboard</h3>
                  <p className="text-sm text-muted-foreground">See your earnings and payout status</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                size="lg" 
                onClick={handleStartOnboarding}
                disabled={onboardingLoading || (settings && !settings.signupsEnabled)}
              >
                {onboardingLoading ? 'Setting up...' : 'Join Affiliate Program'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You'll be redirected to Stripe to complete onboarding. Sidecar does not collect any banking information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Is an affiliate - show dashboard
  const referralLink = getReferralLink();
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const paidReferrals = referrals.filter(r => r.status === 'paid');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
        </div>
        {getStatusBadge(affiliate?.status || 'pending')}
      </div>

      {affiliate && !affiliate.stripe_onboarding_complete && (
        <DismissibleBanner
          storageKey="affiliate-onboarding-incomplete"
          variant="warning"
        >
          Complete your Stripe onboarding to start earning commissions.
          <Button variant="link" className="ml-2 p-0 h-auto" onClick={handleStartOnboarding}>
            Continue Setup
          </Button>
        </DismissibleBanner>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Referrals</CardDescription>
            <CardTitle className="text-3xl">{affiliate?.total_referrals || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earnings</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${(affiliate?.total_earnings || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Earnings</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              ${(affiliate?.pending_earnings || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Commission Rate</CardDescription>
            <CardTitle className="text-3xl">
              {affiliate?.commission_type === 'percentage' 
                ? `${((affiliate?.commission_rate || 0) * 100).toFixed(0)}%`
                : `$${(affiliate?.commission_rate || 0).toFixed(2)}`
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>Share this link to earn commissions on referrals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-muted rounded-md text-sm break-all">
              {referralLink}
            </code>
            <Button variant="outline" onClick={copyReferralLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {affiliate?.stripe_onboarding_complete && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={openStripeDashboard}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Stripe Dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>
            {pendingReferrals.length} pending · {paidReferrals.length} paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No referrals yet. Share your link to start earning!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.slice(0, 10).map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>{format(new Date(referral.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{referral.product_name}</TableCell>
                    <TableCell>${referral.sale_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">${referral.commission_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={referral.status === 'paid' ? 'default' : 'secondary'}>
                        {referral.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {payout.processed_at 
                        ? format(new Date(payout.processed_at), 'MMM d, yyyy')
                        : format(new Date(payout.created_at), 'MMM d, yyyy')
                      }
                    </TableCell>
                    <TableCell className="text-green-600">${payout.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
