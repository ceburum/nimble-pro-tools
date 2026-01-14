-- Add setup and cloud storage columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_sector text,
ADD COLUMN IF NOT EXISTS cloud_storage_tier text,
ADD COLUMN IF NOT EXISTS cloud_storage_used_bytes bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_started_at jsonb,
ADD COLUMN IF NOT EXISTS financial_tool_enabled boolean DEFAULT false;

-- Migrate existing tax_pro_enabled users to financial_tool_enabled
UPDATE public.user_settings
SET financial_tool_enabled = true
WHERE tax_pro_enabled = true OR financial_pro_enabled = true;