-- =============================================
-- Harden function EXECUTE privileges (least privilege)
-- Date: 2025-11-13
-- =============================================

-- 1) Read-only RPC: get_matched_analyzed_contents_count
--    - Restrict to authenticated users (and service_role for server-side calls)
REVOKE EXECUTE ON FUNCTION public.get_matched_analyzed_contents_count(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_matched_analyzed_contents_count(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_matched_analyzed_contents_count(UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_matched_analyzed_contents_count(UUID) TO service_role;

-- 2) Trigger-only functions: remove broad EXECUTE grants
--    Note: Trigger functions are not meant to be called directly by clients.
--    Removing EXECUTE from PUBLIC/anon/authenticated does not affect trigger execution.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()          FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- 3) Session delete RPC: ensure service_role-only execution (idempotent)
REVOKE EXECUTE ON FUNCTION public.delete_user_sessions(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_user_sessions(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_sessions(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.delete_user_sessions(UUID) TO service_role;

-- 4) Access token hook: keep restricted (no-op if already tight)
--    Included for completeness; safe if grants don't exist.
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;


