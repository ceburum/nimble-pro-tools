-- Add scheduling columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS arrival_window_start TIME;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS arrival_window_end TIME;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS schedule_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS schedule_notification_sent_at TIMESTAMPTZ;