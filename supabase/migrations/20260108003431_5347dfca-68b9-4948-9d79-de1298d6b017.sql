-- Add response token columns to projects table for secure quote responses
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS response_token UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS response_token_used_at TIMESTAMPTZ;

-- Create private storage bucket for project files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own project files
CREATE POLICY "Users can upload their own project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own project files
CREATE POLICY "Users can read their own project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own project files
CREATE POLICY "Users can update their own project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own project files
CREATE POLICY "Users can delete their own project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);