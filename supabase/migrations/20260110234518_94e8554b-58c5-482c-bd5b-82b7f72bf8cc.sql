-- Create a table for standalone mileage entries (not tied to a project)
CREATE TABLE public.mileage_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_location TEXT,
  end_location TEXT,
  distance NUMERIC NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  is_tracking BOOLEAN NOT NULL DEFAULT false,
  coordinates JSONB,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mileage_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mileage entries" 
ON public.mileage_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mileage entries" 
ON public.mileage_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mileage entries" 
ON public.mileage_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mileage entries" 
ON public.mileage_entries 
FOR DELETE 
USING (auth.uid() = user_id);