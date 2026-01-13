import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DismissibleBanner } from '@/components/ui/dismissible-banner';
import { AffiliateApplicationForm } from '@/components/affiliates/AffiliateApplicationForm';
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
  CreditCard,
  FileText
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

  // Get recommended_by from URL params
  const recommendedByCode = searchParams.get('recommended_by') || searchParams.get('ref');

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

  // Not yet an affiliate - show application form
  if (!isAffiliate) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Become a Salesperson</h1>
        </div>

        {settings && !settings.signupsEnabled && (
          <DismissibleBanner
            storageKey="affiliate-closed"
            variant="warning"
            className="mb-4"
          >
            Salesperson applications are temporarily paused. Check back later!
          </DismissibleBanner>
        )}

        {settings && settings.currentAffiliates >= settings.maxAffiliates && (
          <DismissibleBanner
            storageKey="affiliate-full"
            variant="warning"
            className="mb-4"
          >
            We've reached our current salesperson limit. More spots opening soon!
          </DismissibleBanner>
        )}

        <AffiliateApplicationForm 
          recommendedByEmail={recommendedByCode}
          onSubmitSuccess={checkAffiliateStatus}
        />
      </div>
    );
  }

  // Is an affiliate but status is pending - show pending message
  if (affiliate?.status === 'pending') {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Application Submitted</h1>
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Application Under Review
            </CardTitle>
            <CardDescription>
              Your application to become a Sidecar Salesperson is being reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Applications are typically reviewed within 1-2 business days.
              </span>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Your Referral Code (Reserved)</p>
              <code className="text-lg font-mono">{affiliate.referral_code}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Once approved, you'll receive instructions to complete payment setup through Stripe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affiliate rejected
  if (affiliate?.status === 'rejected') {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold">Application Status</h1>
        </div>

        <Card className="max-w-xl border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Application Not Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unfortunately, your application was not approved at this time. If you have questions, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Is an active affiliate - show dashboard
  const referralLink = getReferralLink();
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const paidReferrals = referrals.filter(r => r.status === 'paid');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Salesperson Dashboard</h1>
        </div>
        {getStatusBadge(affiliate?.status || 'pending')}
      </div>

      {affiliate && !affiliate.stripe_onboarding_complete && affiliate.status === 'active' && (
        <DismissibleBanner
          storageKey="affiliate-onboarding-incomplete"
          variant="warning"
        >
          Complete your Stripe onboarding to start earning commissions.
          <Button variant="link" className="ml-2 p-0 h-auto" onClick={handleStartOnboarding}>
            {onboardingLoading ? 'Loading...' : 'Continue Setup'}
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
