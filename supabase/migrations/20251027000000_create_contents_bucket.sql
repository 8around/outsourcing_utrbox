-- =============================================
-- Create Storage Bucket: contents
-- Date: 2025-10-27
-- Description: Create 'contents' bucket for user-uploaded images
-- =============================================

-- Create 'contents' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contents',
  'contents',
  false,                                                      -- Private bucket (RLS controlled)
  10485760,                                                   -- 10MB in bytes (10 * 1024 * 1024)
  ARRAY['image/png', 'image/jpeg', 'image/jpg']              -- Only image files allowed
)
ON CONFLICT (id) DO NOTHING;                                  -- Skip if bucket already exists
