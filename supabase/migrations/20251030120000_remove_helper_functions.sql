-- =============================================
-- Remove Helper Functions Migration
-- Date: 2025-10-30
-- Description: Remove is_admin() and is_approved_user() helper functions
-- Reason: All RLS policies now use JWT claims directly, these functions are no longer needed
-- =============================================

-- =============================================
-- 1. DROP HELPER FUNCTIONS
-- =============================================

-- Remove is_admin() function
DROP FUNCTION IF EXISTS public.is_admin();

-- Remove is_approved_user() function
DROP FUNCTION IF EXISTS public.is_approved_user();

-- =============================================
-- SUMMARY
-- =============================================
-- These functions have been replaced by JWT claims in RLS policies:
-- - is_admin() → (auth.jwt() ->> 'role')::text = 'admin' AND (auth.jwt() ->> 'is_approved')::boolean = true
-- - is_approved_user() → (auth.jwt() ->> 'is_approved')::boolean = true
--
-- Performance benefit: Eliminates database queries in RLS policy evaluation
-- =============================================
