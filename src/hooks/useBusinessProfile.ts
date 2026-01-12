import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface BusinessProfile {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  licenseNumber: string;
  tagline: string;
  invoicePrefix: string;
  paymentInstructions: string;
  dashboardLogoUrl: string | null;
}

const defaultProfile: BusinessProfile = {
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  licenseNumber: '',
  tagline: '',
  invoicePrefix: 'INV-',
  paymentInstructions: '',
  dashboardLogoUrl: null,
};

export function useBusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(defaultProfile);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('company_name, company_address, company_phone, company_email, license_number, tagline, invoice_prefix, payment_instructions, dashboard_logo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            companyName: data.company_name || '',
            companyAddress: data.company_address || '',
            companyPhone: data.company_phone || '',
            companyEmail: data.company_email || '',
            licenseNumber: data.license_number || '',
            tagline: data.tagline || '',
            invoicePrefix: data.invoice_prefix || 'INV-',
            paymentInstructions: data.payment_instructions || '',
            dashboardLogoUrl: data.dashboard_logo_url || null,
          });
        }
      } catch (error) {
        console.error('Error fetching business profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<BusinessProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Map camelCase to snake_case for Supabase
      const dbUpdates: Record<string, unknown> = {};
      if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
      if (updates.companyAddress !== undefined) dbUpdates.company_address = updates.companyAddress;
      if (updates.companyPhone !== undefined) dbUpdates.company_phone = updates.companyPhone;
      if (updates.companyEmail !== undefined) dbUpdates.company_email = updates.companyEmail;
      if (updates.licenseNumber !== undefined) dbUpdates.license_number = updates.licenseNumber;
      if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
      if (updates.invoicePrefix !== undefined) dbUpdates.invoice_prefix = updates.invoicePrefix;
      if (updates.paymentInstructions !== undefined) dbUpdates.payment_instructions = updates.paymentInstructions;
      if (updates.dashboardLogoUrl !== undefined) dbUpdates.dashboard_logo_url = updates.dashboardLogoUrl;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...dbUpdates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      toast({
        title: "Settings saved",
        description: "Your business profile has been updated.",
      });
      return true;
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast({
        title: "Error",
        description: "Failed to save business profile.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { profile, loading, updateProfile };
}
