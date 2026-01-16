-- Create onboarding_steps table for admin-editable onboarding content
CREATE TABLE public.onboarding_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_key TEXT NOT NULL UNIQUE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  content_title TEXT,
  content_description TEXT,
  content_body TEXT,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to_professions TEXT[] DEFAULT '{}',
  applies_to_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profession_menu_config table for profession-based menu control
CREATE TABLE public.profession_menu_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profession_id UUID REFERENCES public.professions(id) ON DELETE CASCADE,
  menu_item_key TEXT NOT NULL,
  menu_label TEXT NOT NULL,
  default_label TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon_name TEXT,
  route_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profession_id, menu_item_key)
);

-- Create app_flow_steps table for step-based logic visibility
CREATE TABLE public.app_flow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_name TEXT NOT NULL,
  step_key TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  next_step_key TEXT,
  conditions JSONB DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(flow_name, step_key)
);

-- Enable RLS on all tables
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profession_menu_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_flow_steps ENABLE ROW LEVEL SECURITY;

-- Public read access for all (needed for app to function)
CREATE POLICY "Anyone can read onboarding steps"
ON public.onboarding_steps FOR SELECT
USING (true);

CREATE POLICY "Anyone can read profession menu config"
ON public.profession_menu_config FOR SELECT
USING (true);

CREATE POLICY "Anyone can read app flow steps"
ON public.app_flow_steps FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage onboarding steps"
ON public.onboarding_steps FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage profession menu config"
ON public.profession_menu_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage app flow steps"
ON public.app_flow_steps FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add updated_at triggers
CREATE TRIGGER update_onboarding_steps_updated_at
BEFORE UPDATE ON public.onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profession_menu_config_updated_at
BEFORE UPDATE ON public.profession_menu_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_flow_steps_updated_at
BEFORE UPDATE ON public.app_flow_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial onboarding steps
INSERT INTO public.onboarding_steps (step_key, step_name, step_order, content_title, content_description, conditions) VALUES
('welcome', 'Welcome Screen', 1, 'Welcome to Nimble', 'Let''s set up your business in just a few steps', '{}'),
('business_name', 'Business Name', 2, 'Your Business Name', 'This will appear on your invoices and quotes', '{}'),
('business_type', 'Business Type Selection', 3, 'How Do You Operate?', 'Choose how you typically serve your customers', '{}'),
('profession_select', 'Profession Selection', 4, 'What Best Describes Your Business?', 'We''ll suggest features and services based on your industry', '{}'),
('service_menu_setup', 'Service Menu Setup', 5, 'Set Up Your Service Menu', 'Choose how you want to set up your service menu', '{"requires_profession": true}'),
('review_services', 'Review Services', 6, 'Review Your Services', 'Remove any services you don''t need', '{"requires_prepopulated_menu": true}'),
('setup_complete', 'Setup Complete', 7, 'You''re All Set!', 'Your business is ready to go', '{}');

-- Seed initial app flow steps for setup wizard
INSERT INTO public.app_flow_steps (flow_name, step_key, step_name, step_order, next_step_key, conditions, description) VALUES
('setup_wizard', 'name', 'Business Name Entry', 1, 'type', '{}', 'User enters their business name'),
('setup_wizard', 'type', 'Business Type Selection', 2, 'sector', '{}', 'User selects mobile/job or stationary/appointment'),
('setup_wizard', 'sector', 'Profession Selection', 3, 'menu_options', '{}', 'User selects their profession/industry'),
('setup_wizard', 'menu_options', 'Service Menu Options', 4, 'review', '{"condition": "sector != other"}', 'User chooses blank, prepopulated, or skip'),
('setup_wizard', 'review', 'Service Review', 5, NULL, '{"condition": "menuChoice == prepopulated"}', 'User reviews and customizes services');

-- Seed default menu items for all professions (global defaults)
INSERT INTO public.profession_menu_config (profession_id, menu_item_key, menu_label, default_label, is_enabled, display_order, icon_name, route_path) VALUES
(NULL, 'dashboard', 'Dashboard', 'Dashboard', true, 1, 'LayoutDashboard', '/'),
(NULL, 'clients', 'Clients', 'Clients', true, 2, 'Users', '/clients'),
(NULL, 'projects', 'Projects', 'Projects', true, 3, 'FolderOpen', '/projects'),
(NULL, 'invoices', 'Invoices', 'Invoices', true, 4, 'FileText', '/invoices'),
(NULL, 'quotes', 'Quotes', 'Quotes', true, 5, 'FileSearch', '/quotes'),
(NULL, 'appointments', 'Appointments', 'Appointments', true, 6, 'Calendar', '/appointments'),
(NULL, 'service_menu', 'Service Menu', 'Service Menu', true, 7, 'ListChecks', '/service-menu'),
(NULL, 'reports', 'Reports', 'Reports', true, 8, 'BarChart3', '/reports'),
(NULL, 'settings', 'Settings', 'Settings', true, 9, 'Settings', '/settings');