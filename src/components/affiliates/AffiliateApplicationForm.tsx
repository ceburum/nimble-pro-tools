import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Link, TrendingUp, Send } from 'lucide-react';

interface AffiliateApplicationFormProps {
  recommendedByEmail?: string | null;
  onSubmitSuccess: () => void;
}

export function AffiliateApplicationForm({ recommendedByEmail, onSubmitSuccess }: AffiliateApplicationFormProps) {
  const [applicationText, setApplicationText] = useState('');
  const [recommendedBy, setRecommendedBy] = useState(recommendedByEmail || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationText.trim()) {
      toast({
        title: 'Application required',
        description: 'Please tell us why you would be a good promoter.',
        variant: 'destructive',
      });
      return;
    }

    if (applicationText.trim().length < 50) {
      toast({
        title: 'More detail needed',
        description: 'Please provide at least 50 characters about your experience.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to apply.',
          variant: 'destructive',
        });
        return;
      }

      // Check if already an affiliate
      const { data: existing } = await supabase
        .from('affiliates')
        .select('id, status')
        .eq('user_id', session.user.id)
        .single();

      if (existing) {
        toast({
          title: 'Already applied',
          description: `Your application is ${existing.status}. Please wait for admin review.`,
          variant: 'destructive',
        });
        return;
      }

      // Find recommending affiliate if email provided
      let recommendedByAffiliateId: string | null = null;
      if (recommendedBy.trim()) {
        // Look up affiliate by checking if there's a user with that email
        const { data: recommender } = await supabase
          .from('affiliates')
          .select('id, referral_code')
          .ilike('referral_code', recommendedBy.trim())
          .single();

        if (recommender) {
          recommendedByAffiliateId = recommender.id;
        }
      }

      // Generate referral code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_referral_code');
      if (codeError) throw codeError;

      // Create affiliate application
      const { error } = await supabase
        .from('affiliates')
        .insert({
          user_id: session.user.id,
          referral_code: codeData,
          status: 'pending',
          application_text: applicationText.trim(),
          recommended_by_email: recommendedBy.trim() || null,
          recommended_by_affiliate_id: recommendedByAffiliateId,
          application_submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Application submitted!',
        description: 'We\'ll review your application and get back to you soon.',
      });

      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Become a Sidecar Salesperson</CardTitle>
        <CardDescription>
          Apply to join our affiliate program and earn commissions by promoting Sidecar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits */}
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

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
          <div>
            <Label htmlFor="application">
              Tell us why you'd be a good Sidecar promoter *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Include any sales experience, relevant skills, or how you plan to promote Sidecar.
            </p>
            <Textarea
              id="application"
              placeholder="I've been in the trades for 10 years and know a lot of contractors who could benefit from Sidecar..."
              value={applicationText}
              onChange={(e) => setApplicationText(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {applicationText.length}/1000 characters (minimum 50)
            </p>
          </div>

          <div>
            <Label htmlFor="recommended">
              Recommended by (optional)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              If an existing affiliate recommended you, enter their referral code.
            </p>
            <Input
              id="recommended"
              placeholder="e.g., ABC12XYZ"
              value={recommendedBy}
              onChange={(e) => setRecommendedBy(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting}>
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Applications are typically reviewed within 1-2 business days. Once approved, you'll receive instructions to complete Stripe onboarding.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
