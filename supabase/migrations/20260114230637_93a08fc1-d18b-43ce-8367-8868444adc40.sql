-- Create table for tracking service list requests from users
CREATE TABLE public.service_list_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sector_id text NOT NULL,
  sector_name text NOT NULL,
  user_email text,
  requested_at timestamptz DEFAULT now(),
  fulfilled boolean DEFAULT false,
  fulfilled_at timestamptz,
  notes text
);

-- Enable RLS
ALTER TABLE public.service_list_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can create their own requests"
ON public.service_list_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own requests
CREATE POLICY "Users can view their own requests"
ON public.service_list_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all requests
CREATE POLICY "Admins can view all requests"
ON public.service_list_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update requests
CREATE POLICY "Admins can update requests"
ON public.service_list_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));