-- Create admin_app_settings table for global app settings
CREATE TABLE public.admin_app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_mode boolean NOT NULL DEFAULT false,
    maintenance_message text,
    signups_enabled boolean NOT NULL DEFAULT true,
    force_update_version text,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for maintenance mode check)
CREATE POLICY "Anyone can read app settings" ON public.admin_app_settings
    FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update app settings" ON public.admin_app_settings
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert (initial setup)
CREATE POLICY "Admins can insert app settings" ON public.admin_app_settings
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default settings row
INSERT INTO public.admin_app_settings (id, maintenance_mode, signups_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', false, true);

-- Create global_feature_flags table
CREATE TABLE public.global_feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name text NOT NULL UNIQUE,
    is_enabled boolean NOT NULL DEFAULT false,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.global_feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read flags (needed for feature checks)
CREATE POLICY "Anyone can read global feature flags" ON public.global_feature_flags
    FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage global feature flags" ON public.global_feature_flags
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create user_feature_flags table for per-user overrides
CREATE TABLE public.user_feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_name text NOT NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    reason text,
    UNIQUE(user_id, flag_name)
);

-- Enable RLS
ALTER TABLE public.user_feature_flags ENABLE ROW LEVEL SECURITY;

-- Users can view their own flags
CREATE POLICY "Users can view their own feature flags" ON public.user_feature_flags
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all flags
CREATE POLICY "Admins can manage user feature flags" ON public.user_feature_flags
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create subscription_overrides table for admin billing controls
CREATE TABLE public.subscription_overrides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    override_type text NOT NULL, -- 'free_access', 'extended_trial', 'subscription_override'
    feature_name text, -- specific feature or 'all'
    is_active boolean NOT NULL DEFAULT true,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    reason text,
    billing_status text DEFAULT 'active', -- 'active', 'past_due', 'canceled'
    UNIQUE(user_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.subscription_overrides ENABLE ROW LEVEL SECURITY;

-- Users can view their own overrides
CREATE POLICY "Users can view their own subscription overrides" ON public.subscription_overrides
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all overrides
CREATE POLICY "Admins can manage subscription overrides" ON public.subscription_overrides
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add 'staff' to app_role enum if not exists (Admin, Staff, User)
-- Note: The enum already has 'admin', 'moderator', 'user' - we'll treat moderator as staff

-- Create trigger for updating timestamps
CREATE TRIGGER update_admin_app_settings_updated_at
    BEFORE UPDATE ON public.admin_app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_feature_flags_updated_at
    BEFORE UPDATE ON public.global_feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();