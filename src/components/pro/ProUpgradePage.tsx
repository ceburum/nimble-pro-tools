import { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

interface ProUpgradePageProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  onEnable: () => Promise<boolean>;
  loading?: boolean;
}

export function ProUpgradePage({
  icon,
  title,
  description,
  features,
  onEnable,
  loading = false
}: ProUpgradePageProps) {
  const handleUpgrade = async () => {
    await onEnable();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title={title} description={description} />

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
        <Card className="max-w-md w-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
              {icon}
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              onClick={handleUpgrade} 
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Activating...' : `Activate ${title}`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Free during beta. Premium pricing coming soon.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
