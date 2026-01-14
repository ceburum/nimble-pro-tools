import { useState } from 'react';
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmailProvider } from '@/hooks/useEmailProvider';
import { EMAIL_PROVIDERS, EmailProviderType, UNSUPPORTED_PROVIDERS } from '@/types/emailProvider';

interface EmailProviderCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerType: EmailProviderType;
  onSaved: () => void;
}

export function EmailProviderCredentialsDialog({
  open,
  onOpenChange,
  providerType,
  onSaved,
}: EmailProviderCredentialsDialogProps) {
  const { saveProvider, testConnection } = useEmailProvider();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [apiKey, setApiKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpUseTls, setSmtpUseTls] = useState(true);
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  
  const [warning, setWarning] = useState<string | null>(null);

  const providerInfo = EMAIL_PROVIDERS.find(p => p.id === providerType);
  const isCustomSmtp = providerType === 'custom_smtp';
  const usesApiKey = providerInfo?.usesApiKey ?? false;
  const usesSmtp = isCustomSmtp || providerInfo?.usesSmtp;

  const validateSmtpHost = (host: string) => {
    const lowerHost = host.toLowerCase();
    const isUnsupported = UNSUPPORTED_PROVIDERS.some(p => lowerHost.includes(p.replace('.com', '')));
    if (isUnsupported) {
      setWarning('This appears to be a consumer email provider. These typically block automated sending and may not work.');
    } else {
      setWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const credentials: {
        apiKey?: string;
        smtpHost?: string;
        smtpPort?: number;
        smtpUsername?: string;
        smtpPassword?: string;
        smtpUseTls?: boolean;
        fromEmail?: string;
        fromName?: string;
      } = {};

      if (usesApiKey && apiKey) {
        credentials.apiKey = apiKey;
      }

      if (usesSmtp) {
        if (smtpHost) credentials.smtpHost = smtpHost;
        if (smtpPort) credentials.smtpPort = parseInt(smtpPort, 10);
        if (smtpUsername) credentials.smtpUsername = smtpUsername;
        if (smtpPassword) credentials.smtpPassword = smtpPassword;
        credentials.smtpUseTls = smtpUseTls;
      }

      if (fromEmail) credentials.fromEmail = fromEmail;
      if (fromName) credentials.fromName = fromName;

      const success = await saveProvider(providerType, credentials);
      
      if (success) {
        // Test the connection after saving
        await testConnection();
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  const getApiKeyLabel = () => {
    switch (providerType) {
      case 'postmark':
        return 'Server API Token';
      case 'sendgrid':
        return 'API Key';
      case 'mailgun':
        return 'API Key';
      case 'amazon_ses':
        return 'Access Key ID';
      case 'zoho_zeptomail':
        return 'Send Mail Token';
      default:
        return 'API Key';
    }
  };

  const getApiKeyPlaceholder = () => {
    switch (providerType) {
      case 'postmark':
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
      case 'sendgrid':
        return 'SG.xxxxxxxxxxxxxxxxxxxx';
      case 'mailgun':
        return 'key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      case 'amazon_ses':
        return 'AKIAIOSFODNN7EXAMPLE';
      default:
        return 'Enter your API key';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Connect {providerInfo?.name || 'Email Provider'}
          </DialogTitle>
          <DialogDescription>
            Enter your credentials to connect this email service.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Key field for API-based providers */}
          {usesApiKey && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">{getApiKeyLabel()}</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showPassword ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={getApiKeyPlaceholder()}
                  required={usesApiKey}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* SMTP fields for SMTP-based providers */}
          {usesSmtp && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => {
                      setSmtpHost(e.target.value);
                      validateSmtpHost(e.target.value);
                    }}
                    placeholder="smtp.example.com"
                    required={isCustomSmtp}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    required={isCustomSmtp}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input
                  id="smtpUsername"
                  type="text"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="username or email"
                  required={isCustomSmtp}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <div className="relative">
                  <Input
                    id="smtpPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isCustomSmtp}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smtpUseTls"
                  checked={smtpUseTls}
                  onCheckedChange={(checked) => setSmtpUseTls(checked === true)}
                />
                <Label htmlFor="smtpUseTls" className="text-sm font-normal">
                  Use TLS/SSL encryption
                </Label>
              </div>
            </>
          )}

          {/* Common fields */}
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="invoices@yourdomain.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be verified with your email provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName">From Name (Optional)</Label>
            <Input
              id="fromName"
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Your Business Name"
            />
          </div>

          {/* Warning for unsupported providers */}
          {warning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save & Test'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
