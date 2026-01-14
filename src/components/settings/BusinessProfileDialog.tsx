import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, FileText, CreditCard, Hash, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBusinessProfile, BusinessProfile } from '@/hooks/useBusinessProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailDeliverySettings } from './EmailDeliverySettings';

interface BusinessProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessProfileDialog({ open, onOpenChange }: BusinessProfileDialogProps) {
  const { profile, loading, updateProfile } = useBusinessProfile();
  const [formData, setFormData] = useState<Omit<BusinessProfile, 'dashboardLogoUrl'>>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    licenseNumber: '',
    tagline: '',
    invoicePrefix: 'INV-',
    paymentInstructions: '',
  });
  const [saving, setSaving] = useState(false);
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName,
        companyAddress: profile.companyAddress,
        companyPhone: profile.companyPhone,
        companyEmail: profile.companyEmail,
        licenseNumber: profile.licenseNumber,
        tagline: profile.tagline,
        invoicePrefix: profile.invoicePrefix,
        paymentInstructions: profile.paymentInstructions,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile(formData);
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Name
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Your Business Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline / Slogan</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Quality work, fair prices"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="companyPhone"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  License #
                </Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="LIC-12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoicePrefix" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice Prefix
                </Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV-"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentInstructions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Custom Payment Instructions
              </Label>
              <Textarea
                id="paymentInstructions"
                value={formData.paymentInstructions}
                onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                placeholder="Payment is due within 30 days. Make checks payable to..."
                rows={3}
              />
            </div>

            <Separator className="my-4" />

            {/* Email Delivery Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Email Delivery
              </Label>
              <p className="text-sm text-muted-foreground">
                Configure how invoices, receipts, and notifications are sent.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailSettingsOpen(true)}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Configure Email Provider
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>

      <EmailDeliverySettings
        open={emailSettingsOpen}
        onOpenChange={setEmailSettingsOpen}
      />
    </Dialog>
  );
}
