import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserReferral } from '@/hooks/useUserReferral';
import { Gift, Copy, CheckCircle, Clock, Share2 } from 'lucide-react';

export function ReferralRewardCard() {
  const {
    loading,
    referralReward,
    hasPurchased,
    generateReferralLink,
    getReferralLink,
    copyReferralLink,
    getStatusLabel,
  } = useUserReferral();

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await generateReferralLink();
    setGenerating(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Don't show if user hasn't made a purchase yet
  if (!hasPurchased && !referralReward) {
    return null;
  }

  const statusInfo = getStatusLabel();
  const referralLink = getReferralLink();

  // User has purchased but hasn't generated a link yet
  if (!referralReward) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Share & Get 50% Back!
          </CardTitle>
          <CardDescription>
            Share your one-time referral link with a friend. When they purchase, you get 50% back (up to half of what you paid).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
            <Share2 className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Get My Referral Link'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User has a referral link - show status
  const isComplete = referralReward.status === 'reward_completed';
  const isPending = referralReward.status === 'reward_pending' || referralReward.status === 'used';
  const isActive = referralReward.status === 'active';

  return (
    <Card className={`${isComplete ? 'border-success/30 bg-success/5' : isPending ? 'border-warning/30 bg-warning/5' : 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                Reward Received!
              </>
            ) : isPending ? (
              <>
                <Clock className="h-5 w-5 text-warning" />
                Reward Processing
              </>
            ) : (
              <>
                <Gift className="h-5 w-5 text-primary" />
                Share & Get 50% Back
              </>
            )}
          </CardTitle>
          {statusInfo && (
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          )}
        </div>
        <CardDescription>
          {statusInfo?.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isActive && referralLink && (
          <div className="flex gap-2">
            <code className="flex-1 p-2 bg-muted rounded-md text-xs sm:text-sm break-all font-mono">
              {referralLink}
            </code>
            <Button variant="outline" size="sm" onClick={copyReferralLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {isComplete && referralReward.reward_amount && (
          <div className="text-center py-2">
            <span className="text-2xl font-bold text-success">
              ${referralReward.reward_amount.toFixed(2)}
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Refunded to your original payment method
            </p>
          </div>
        )}
        {isPending && (
          <div className="text-center py-2">
            <span className="text-xl font-semibold text-warning">
              ${referralReward.reward_amount?.toFixed(2) || '...'}
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Your reward is being processed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
