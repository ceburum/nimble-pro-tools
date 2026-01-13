-- Create enum for referral link status
CREATE TYPE public.referral_link_status AS ENUM ('active', 'used', 'expired', 'reward_pending', 'reward_completed');

-- Create user_referral_rewards table for one-time referral system
CREATE TABLE public.user_referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  original_purchase_amount NUMERIC NOT NULL DEFAULT 0,
  original_stripe_payment_intent_id TEXT,
  -- Link status
  status public.referral_link_status NOT NULL DEFAULT 'active',
  -- When a new buyer uses the link
  referred_buyer_id UUID,
  referred_buyer_email TEXT,
  referred_purchase_amount NUMERIC,
  referred_at TIMESTAMP WITH TIME ZONE,
  -- Reward details
  reward_amount NUMERIC,
  reward_method TEXT DEFAULT 'refund',
  reward_processed_at TIMESTAMP WITH TIME ZONE,
  stripe_refund_id TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days')
);

-- Create unique index to enforce one active link per user
CREATE UNIQUE INDEX user_referral_rewards_one_active_per_user 
  ON public.user_referral_rewards (user_id) 
  WHERE status IN ('active', 'reward_pending');

-- Enable RLS
ALTER TABLE public.user_referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral rewards
CREATE POLICY "Users can view their own referral reward"
  ON public.user_referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own referral (generated via edge function with service role)
CREATE POLICY "Service role can manage referral rewards"
  ON public.user_referral_rewards FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add application fields to affiliates table for salesperson flow
ALTER TABLE public.affiliates 
  ADD COLUMN IF NOT EXISTS application_text TEXT,
  ADD COLUMN IF NOT EXISTS recommended_by_email TEXT,
  ADD COLUMN IF NOT EXISTS recommended_by_affiliate_id UUID REFERENCES public.affiliates(id),
  ADD COLUMN IF NOT EXISTS application_submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Function to generate a unique referral code for user rewards
CREATE OR REPLACE FUNCTION public.generate_user_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := 'REF-';
    i integer;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;