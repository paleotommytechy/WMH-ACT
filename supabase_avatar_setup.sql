-- 1. Ensure avatar_url exists in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create Storage Bucket for Avatars
-- Note: This might need to be run manually if the service role doesn't have bucket creation permissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for 'avatars' bucket

-- Delete existing policies if they exist to avoid conflicts during re-run
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Allow public access to view avatars
CREATE POLICY "Avatar Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow users to upload their own avatar
-- We use the user_id as the first part of the file path (e.g., user_id/avatar.png)
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text 
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text 
);
