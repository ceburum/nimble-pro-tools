-- =============================================
-- BACKEND INFRASTRUCTURE TABLES
-- Analytics, Audit Logs, Push Notifications, Backups
-- =============================================

-- 1. APP ANALYTICS - Track usage, revenue, and metrics
CREATE TABLE IF NOT EXISTS public.app_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'feature_use', 'error', 'revenue', 'conversion'
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.app_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.app_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.app_analytics(created_at DESC);

-- RLS for analytics - users can insert their own, admins can read all
ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own analytics" ON public.app_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own analytics" ON public.app_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON public.app_analytics
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 2. AUDIT LOGS - Track sensitive user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'export', 'admin_action'
  resource_type TEXT, -- 'client', 'invoice', 'project', 'user', 'settings'
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- RLS for audit logs - users can view own, admins can view all
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- 3. PUSH NOTIFICATION TOKENS - Store device tokens for future push notifications
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'web', -- 'web', 'ios', 'android'
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_notification_tokens(is_active) WHERE is_active = true;

ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens" ON public.push_notification_tokens
  FOR ALL USING (auth.uid() = user_id);

-- 4. PUSH NOTIFICATION SETTINGS - User preferences for notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  invoice_reminders BOOLEAN NOT NULL DEFAULT true,
  appointment_reminders BOOLEAN NOT NULL DEFAULT true,
  payment_received BOOLEAN NOT NULL DEFAULT true,
  quote_accepted BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 5. AUTOMATED BACKUPS LOG - Track backup history
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  backup_type TEXT NOT NULL, -- 'manual', 'scheduled', 'pre_migration'
  storage_path TEXT,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  error_message TEXT,
  tables_included TEXT[] DEFAULT '{}',
  record_counts JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_user ON public.backup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_status ON public.backup_logs(status);

ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backups" ON public.backup_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all backups" ON public.backup_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own backups" ON public.backup_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups" ON public.backup_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. REVENUE TRACKING - For analytics dashboard
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'invoice_paid', 'subscription_started', 'addon_purchased', 'refund'
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  related_invoice_id UUID,
  related_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_user ON public.revenue_events(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON public.revenue_events(event_type);
CREATE INDEX IF NOT EXISTS idx_revenue_created ON public.revenue_events(created_at DESC);

ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own revenue" ON public.revenue_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all revenue" ON public.revenue_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert revenue events" ON public.revenue_events
  FOR INSERT WITH CHECK (true);

-- 7. ERROR LOGS - Track application errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- 'frontend', 'edge_function', 'database', 'external_api'
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  url TEXT,
  user_agent TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_errors_user ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_errors_created ON public.error_logs(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage error logs" ON public.error_logs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- 8. COMMISSION TRACKING FRAMEWORK
CREATE TABLE IF NOT EXISTS public.commission_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'sale', 'subscription', 'addon', 'referral'
  product_type TEXT, -- 'base_app', 'mileage_pro', 'financial_tool', etc.
  product_name TEXT,
  sale_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0, -- e.g., 0.1000 for 10%
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'flat'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_transfer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_user ON public.commission_events(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_salesperson ON public.commission_events(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_commission_affiliate ON public.commission_events(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commission_status ON public.commission_events(status);
CREATE INDEX IF NOT EXISTS idx_commission_created ON public.commission_events(created_at DESC);

ALTER TABLE public.commission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commissions for their sales" ON public.commission_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Salespeople can view their commissions" ON public.commission_events
  FOR SELECT USING (auth.uid() = salesperson_id);

CREATE POLICY "Admins can manage all commissions" ON public.commission_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. ENCRYPTION KEY REFERENCES (placeholders for sensitive data)
-- Note: Actual encryption keys stored in Vault or environment variables
CREATE TABLE IF NOT EXISTS public.encryption_key_refs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  key_version INTEGER NOT NULL DEFAULT 1,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  purpose TEXT NOT NULL, -- 'tin_encryption', 'api_keys', 'user_data'
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.encryption_key_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage encryption keys" ON public.encryption_key_refs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default encryption key reference for TIN
INSERT INTO public.encryption_key_refs (key_name, purpose) 
VALUES ('TIN_ENCRYPTION_KEY', 'tin_encryption')
ON CONFLICT (key_name) DO NOTHING;

-- 10. METRICS SNAPSHOTS - Daily aggregated metrics for dashboards
CREATE TABLE IF NOT EXISTS public.metrics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'user_totals', 'revenue', 'feature_usage', 'errors'
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.metrics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON public.metrics_snapshots(metric_type);

ALTER TABLE public.metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metrics" ON public.metrics_snapshots
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_notification_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_events_updated_at
  BEFORE UPDATE ON public.commission_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();