import { useState } from 'react';
import { Mail, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Loader2, Trash2, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useEmailProvider } from '@/hooks/useEmailProvider';
import { EMAIL_PROVIDERS, EmailProviderType, UNSUPPORTED_PROVIDERS } from '@/types/emailProvider';
import { EmailProviderCredentialsDialog } from './EmailProviderCredentialsDialog';
import { format } from 'date-fns';

interface EmailDeliverySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    ? EMAIL_PROVIDERS.find(p => p.id === provider.providerType) 
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Delivery
            </DialogTitle>
            <DialogDescription>
              Connect an email delivery service to send invoices, receipts, and notifications.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notice about personal email providers */}
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Personal email providers like Yahoo, AOL, Gmail, and Outlook block automated 
                  invoice sending and will not work reliably. Use a transactional email service.
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

              {/* Provider List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  {provider ? 'Switch Provider' : 'Choose a Provider'}
                </h3>
                
                <div className="grid gap-3">
                  {EMAIL_PROVIDERS.filter(p => p.id !== 'custom_smtp').map((providerInfo) => (
                    <Card 
                      key={providerInfo.id} 
                      className={`transition-colors ${
                        provider?.providerType === providerInfo.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-muted-foreground/30'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{providerInfo.name}</h4>
                              {providerInfo.recommended && (
                                <Badge variant="secondary" className="text-xs">Recommended</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {providerInfo.description}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConnect(providerInfo.id)}
                            >
                              {provider?.providerType === providerInfo.id ? 'Update' : 'Connect'}
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
                  ))}
                </div>
              </div>

              {/* Advanced: Custom SMTP */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Advanced</h3>
                
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">Other SMTP</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Connect any SMTP server with custom credentials.
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ Unsupported providers (Yahoo, AOL, Gmail) may fail silently.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect('custom_smtp')}
                      >
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
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
