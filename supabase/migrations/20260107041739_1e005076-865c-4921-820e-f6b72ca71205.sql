-- Create a public storage bucket for assets like logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- Allow public read access to assets
CREATE POLICY "Public can view assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- Allow authenticated users to upload assets (for admin use)
CREATE POLICY "Admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assets');