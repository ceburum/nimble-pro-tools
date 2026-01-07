-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until TIMESTAMP WITH TIME ZONE,
  quote_notes TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create project_photos table (references storage, not base64)
CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'progress',
  storage_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_receipts table
CREATE TABLE public.project_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_mileage table
CREATE TABLE public.project_mileage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  distance NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  is_tracking BOOLEAN NOT NULL DEFAULT false,
  coordinates JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_mileage ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can read their own projects" 
  ON public.projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON public.projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON public.projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Project photos RLS policies
CREATE POLICY "Users can read their own project photos" 
  ON public.project_photos FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project photos" 
  ON public.project_photos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project photos" 
  ON public.project_photos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project photos" 
  ON public.project_photos FOR DELETE 
  USING (auth.uid() = user_id);

-- Project receipts RLS policies
CREATE POLICY "Users can read their own project receipts" 
  ON public.project_receipts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project receipts" 
  ON public.project_receipts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project receipts" 
  ON public.project_receipts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project receipts" 
  ON public.project_receipts FOR DELETE 
  USING (auth.uid() = user_id);

-- Project mileage RLS policies
CREATE POLICY "Users can read their own project mileage" 
  ON public.project_mileage FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project mileage" 
  ON public.project_mileage FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project mileage" 
  ON public.project_mileage FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project mileage" 
  ON public.project_mileage FOR DELETE 
  USING (auth.uid() = user_id);

-- Add check constraint for project status
ALTER TABLE public.projects 
  ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'sent', 'accepted', 'in_progress', 'completed', 'invoiced'));

-- Add check constraint for photo type
ALTER TABLE public.project_photos 
  ADD CONSTRAINT project_photos_type_check 
  CHECK (type IN ('before', 'progress', 'after'));