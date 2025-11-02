-- Add webp and gif MIME types to contents storage bucket
-- This migration updates the allowed_mime_types array to include image/webp and image/gif

-- Update the contents bucket to allow webp and gif files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
]
WHERE id = 'contents';

-- Verify the update
DO $$
DECLARE
  bucket_mime_types text[];
BEGIN
  SELECT allowed_mime_types INTO bucket_mime_types
  FROM storage.buckets
  WHERE id = 'contents';

  IF NOT ('image/webp' = ANY(bucket_mime_types) AND 'image/gif' = ANY(bucket_mime_types)) THEN
    RAISE EXCEPTION 'Failed to add webp and gif MIME types to contents bucket';
  END IF;

  RAISE NOTICE 'Successfully added webp and gif MIME types to contents bucket';
END $$;
