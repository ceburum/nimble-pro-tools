-- Create email_provider_settings table for storing user email provider configurations
CREATE TABLE public.email_provider_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('postmark', 'sendgrid', 'mailgun', 'amazon_ses', 'zoho_zeptomail', 'custom_smtp')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- API key based providers (encrypted)
  api_key_encrypted TEXT,
  
  -- SMTP based providers (encrypted)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  smtp_use_tls BOOLEAN DEFAULT true,
  
  -- Common settings
  from_email TEXT,
  from_name TEXT,
  
  -- Connection status
  last_test_at TIMESTAMP WITH TIME ZONE,
  last_test_success BOOLEAN,
  last_test_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Each user can only have one active provider
  CONSTRAINT unique_active_provider_per_user UNIQUE (user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create index for faster lookups
CREATE INDEX idx_email_provider_user_active ON public.email_provider_settings(user_id, is_active);

-- Enable RLS
ALTER TABLE public.email_provider_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only manage their own email settings
CREATE POLICY "Users can view their own email provider settings"
ON public.email_provider_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email provider settings"
ON public.email_provider_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email provider settings"
ON public.email_provider_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email provider settings"
ON public.email_provider_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_email_provider_settings_updated_at
BEFORE UPDATE ON public.email_provider_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();