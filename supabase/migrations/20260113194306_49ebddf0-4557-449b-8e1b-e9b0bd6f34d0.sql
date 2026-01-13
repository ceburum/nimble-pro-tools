-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create affiliate_status enum
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'active', 'paused', 'rejected');

-- Create affiliates table
CREATE TABLE public.affiliates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    stripe_account_id text,
    stripe_account_type text DEFAULT 'express',
    stripe_onboarding_complete boolean DEFAULT false,
    status affiliate_status NOT NULL DEFAULT 'pending',
    referral_code text NOT NULL UNIQUE,
    commission_rate numeric NOT NULL DEFAULT 0.10,
    commission_type text NOT NULL DEFAULT 'percentage',
    total_referrals integer NOT NULL DEFAULT 0,
    total_earnings numeric NOT NULL DEFAULT 0,
    pending_earnings numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliates
CREATE POLICY "Users can view their own affiliate record"
ON public.affiliates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate record"
ON public.affiliates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate record"
ON public.affiliates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates"
ON public.affiliates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create referrals table
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    referred_user_id uuid,
    referred_email text,
    stripe_payment_intent_id text,
    product_type text NOT NULL,
    product_name text NOT NULL,
    sale_amount numeric NOT NULL DEFAULT 0,
    commission_amount numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Affiliates can view their own referrals"
ON public.referrals
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.affiliates
        WHERE affiliates.id = referrals.affiliate_id
        AND affiliates.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all referrals"
ON public.referrals
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create affiliate_settings table for admin controls
CREATE TABLE public.affiliate_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    signups_enabled boolean NOT NULL DEFAULT true,
    max_affiliates integer NOT NULL DEFAULT 25,
    current_affiliates integer NOT NULL DEFAULT 0,
    default_commission_rate numeric NOT NULL DEFAULT 0.10,
    default_commission_type text NOT NULL DEFAULT 'percentage',
    min_payout_threshold numeric NOT NULL DEFAULT 25.00,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid
);

-- Enable RLS on affiliate_settings
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_settings
CREATE POLICY "Anyone can read affiliate settings"
ON public.affiliate_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update affiliate settings"
ON public.affiliate_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default affiliate settings
INSERT INTO public.affiliate_settings (signups_enabled, max_affiliates, default_commission_rate)
VALUES (true, 25, 0.10);

-- Create payouts table
CREATE TABLE public.affiliate_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    stripe_transfer_id text,
    status text NOT NULL DEFAULT 'pending',
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on affiliate_payouts
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_payouts
CREATE POLICY "Affiliates can view their own payouts"
ON public.affiliate_payouts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.affiliates
        WHERE affiliates.id = affiliate_payouts.affiliate_id
        AND affiliates.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all payouts"
ON public.affiliate_payouts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on affiliates
CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := '';
    i integer;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Function to increment affiliate count when new affiliate is created
CREATE OR REPLACE FUNCTION public.increment_affiliate_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.affiliate_settings
    SET current_affiliates = current_affiliates + 1,
        updated_at = now();
    RETURN NEW;
END;
$$;

-- Trigger to increment count on new affiliate
CREATE TRIGGER on_affiliate_created
AFTER INSERT ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.increment_affiliate_count();

-- Function to decrement affiliate count when affiliate is deleted
CREATE OR REPLACE FUNCTION public.decrement_affiliate_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.affiliate_settings
    SET current_affiliates = GREATEST(current_affiliates - 1, 0),
        updated_at = now();
    RETURN OLD;
END;
$$;

-- Trigger to decrement count on affiliate deletion
CREATE TRIGGER on_affiliate_deleted
AFTER DELETE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.decrement_affiliate_count();