-- =============================================
-- Make Storage Bucket Public: contents
-- Date: 2025-10-28
-- Description: Convert 'contents' bucket from private to public
-- =============================================

-- Update 'contents' bucket to be public
-- This allows unauthenticated read access to files in the bucket
UPDATE storage.buckets
SET public = true
WHERE name = 'contents';

-- Verify the change
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
WHERE name = 'contents';

-- =============================================
-- ROLLBACK (if needed):
-- To revert this change and make the bucket private again, run:
--
-- UPDATE storage.buckets
-- SET public = false
-- WHERE name = 'contents';
-- =============================================
