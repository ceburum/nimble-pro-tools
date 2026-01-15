import { useState } from 'react';
import { Mail, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Loader2, Trash2, Settings2, Sparkles, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmailProvider } from '@/hooks/useEmailProvider';
import { 
  TRANSACTIONAL_PROVIDERS, 
  PERSONAL_PROVIDERS, 
  EmailProviderType, 
  UNSUPPORTED_PROVIDERS,
  EmailProviderInfo 
} from '@/types/emailProvider';
import { EmailProviderCredentialsDialog } from './EmailProviderCredentialsDialog';
import { format } from 'date-fns';

interface EmailDeliverySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProviderCard({ 
  providerInfo, 
  isActive, 
  onConnect 
}: { 
  providerInfo: EmailProviderInfo; 
  isActive: boolean; 
  onConnect: (id: EmailProviderType) => void;
}) {
  return (
    <Card 
      className={`transition-colors ${
        isActive 
          ? 'border-primary bg-primary/5' 
          : 'hover:border-muted-foreground/30'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{providerInfo.name}</h4>
              {providerInfo.recommended && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  Recommended
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {providerInfo.description}
            </p>
            {providerInfo.freeTier && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <p className="text-xs font-medium text-primary">
                  Free tier: {providerInfo.freeTier}
                </p>
                {providerInfo.freeTierNote && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {providerInfo.freeTierNote}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConnect(providerInfo.id)}
            >
              {isActive ? 'Update' : 'Connect'}
            </Button>
            {providerInfo.signupUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(providerInfo.signupUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmailDeliverySettings({ open, onOpenChange }: EmailDeliverySettingsProps) {
  const { provider, loading, testing, testConnection, deleteProvider } = useEmailProvider();
  const [selectedProvider, setSelectedProvider] = useState<EmailProviderType | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConnect = (providerType: EmailProviderType) => {
    setSelectedProvider(providerType);
    setCredentialsOpen(true);
  };

  const handleCredentialsSaved = () => {
    setCredentialsOpen(false);
    setSelectedProvider(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteProvider();
    setDeleting(false);
  };

  const activeProviderInfo = provider 
    ? [...TRANSACTIONAL_PROVIDERS, ...PERSONAL_PROVIDERS].find(p => p.id === provider.providerType) 
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Delivery
            </DialogTitle>
            <DialogDescription>
              Connect an email service to send invoices, receipts, and appointment notifications.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {/* Friendly explanation */}
                <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Why free tiers matter:</strong> Most small businesses send fewer than 1,000 emails/month. 
                    Knowing free tier limits helps you pick the right service and plan your costs as you grow! 📧
                  </AlertDescription>
                </Alert>

                {/* Current Provider Status */}
                {provider && activeProviderInfo && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Connected: {activeProviderInfo.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {provider.fromEmail && (
                        <p className="text-sm text-muted-foreground">
                          Sending from: <span className="font-medium text-foreground">{provider.fromEmail}</span>
                        </p>
                      )}
                      
                      {provider.lastTestAt && (
                        <div className="flex items-center gap-2 text-sm">
                          {provider.lastTestSuccess ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-muted-foreground">
                            Last tested: {format(new Date(provider.lastTestAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      )}

                      {provider.lastTestError && !provider.lastTestSuccess && (
                        <p className="text-sm text-red-600">{provider.lastTestError}</p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection()}
                          disabled={testing}
                        >
                          {testing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Settings2 className="h-4 w-4 mr-2" />
                          )}
                          Test Connection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(provider.providerType)}
                        >
                          Update Credentials
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Transactional Email Services */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Transactional Email Services
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Purpose-built for automated emails like invoices, receipts, and reminders. Best deliverability!
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    {TRANSACTIONAL_PROVIDERS.map((providerInfo) => (
                      <ProviderCard
                        key={providerInfo.id}
                        providerInfo={providerInfo}
                        isActive={provider?.providerType === providerInfo.id}
                        onConnect={handleConnect}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Personal/Business Email */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Business Email (SMTP)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Send from your own business email address. Good for personal touch, but may have sending limits.
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    {PERSONAL_PROVIDERS.map((providerInfo) => (
                      <ProviderCard
                        key={providerInfo.id}
                        providerInfo={providerInfo}
                        isActive={provider?.providerType === providerInfo.id}
                        onConnect={handleConnect}
                      />
                    ))}
                  </div>
                </div>

                {/* Warning about unsupported providers */}
                <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                    <strong>Note:</strong> Personal email providers like Yahoo, AOL, Gmail, and Outlook 
                    typically block automated sending and won't work reliably for invoices. Use a 
                    transactional service or your own business domain instead.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedProvider && (
        <EmailProviderCredentialsDialog
          open={credentialsOpen}
          onOpenChange={setCredentialsOpen}
          providerType={selectedProvider}
          onSaved={handleCredentialsSaved}
        />
      )}
    </>
  );
}
