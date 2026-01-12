import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Calculator, Shield, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Partner {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  cta: string;
}

const partners: Partner[] = [
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync your invoices and expenses for seamless accounting. Popular choice for contractors.',
    icon: <Calculator className="h-5 w-5 text-green-600" />,
    url: 'https://quickbooks.intuit.com/partners/',
    cta: 'Learn More',
  },
  {
    id: 'zoho-mail',
    name: 'Zoho Mail',
    description: 'Professional business email with your domain. Easy setup, reliable delivery, and free tier available.',
    icon: <Mail className="h-5 w-5 text-yellow-600" />,
    url: 'https://www.zoho.com/mail/zohomail-pricing.html',
    cta: 'Get Started',
  },
  {
    id: 'simply-business',
    name: 'Simply Business',
    description: 'Get liability insurance, tools coverage, and commercial auto insurance tailored for contractors.',
    icon: <Shield className="h-5 w-5 text-blue-600" />,
    url: 'https://www.simplybusiness.com/contractors-insurance/',
    cta: 'Get a Quote',
  },
];

export function PartnerSuggestions() {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDismissedState();
    }
  }, [user]);

  const fetchDismissedState = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('partner_suggestions_dismissed')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setIsDismissed(data?.partner_suggestions_dismissed ?? false);
    } catch (error) {
      console.error('Error fetching partner suggestions state:', error);
      setIsDismissed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          partner_suggestions_dismissed: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      setIsDismissed(true);
    } catch (error) {
      console.error('Error dismissing partner suggestions:', error);
    }
  };

  if (isLoading || isDismissed) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Tools We Recommend</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Partner services to help grow your business
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
              {partner.icon}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium">{partner.name}</h4>
              <p className="text-sm text-muted-foreground">{partner.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => window.open(partner.url, '_blank')}
            >
              {partner.cta}
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
