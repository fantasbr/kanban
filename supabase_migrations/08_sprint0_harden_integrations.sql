-- ============================================
-- SPRINT 0: Integration security hardening
-- Date: 2026-03-14
-- ============================================

-- Ensure RLS is enabled on integration tables
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_settings ENABLE ROW LEVEL SECURITY;

-- Helper used by policies
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  );
$$;

COMMENT ON FUNCTION public.current_user_is_admin()
IS 'Returns true when the authenticated user has admin permissions.';

GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO service_role;

-- Drop all old policies from target tables so policy behavior is deterministic
DO $$
DECLARE
  table_name text;
  policy_name text;
  target_tables text[] := ARRAY[
    'api_keys',
    'webhook_subscriptions',
    'api_logs',
    'webhook_logs',
    'webhook_queue',
    'app_settings'
  ];
BEGIN
  FOREACH table_name IN ARRAY target_tables
  LOOP
    FOR policy_name IN
      SELECT p.policyname
      FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = table_name
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        policy_name,
        table_name
      );
    END LOOP;
  END LOOP;
END $$;

-- --------------------------------------------
-- api_keys
-- --------------------------------------------
CREATE POLICY service_role_all_api_keys
  ON public.api_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY admins_read_api_keys
  ON public.api_keys
  FOR SELECT
  USING (public.current_user_is_admin());

CREATE POLICY admins_insert_api_keys
  ON public.api_keys
  FOR INSERT
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY admins_update_api_keys
  ON public.api_keys
  FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY admins_delete_api_keys
  ON public.api_keys
  FOR DELETE
  USING (public.current_user_is_admin());

-- --------------------------------------------
-- webhook_subscriptions
-- --------------------------------------------
CREATE POLICY service_role_all_webhook_subscriptions
  ON public.webhook_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY admins_read_webhook_subscriptions
  ON public.webhook_subscriptions
  FOR SELECT
  USING (public.current_user_is_admin());

CREATE POLICY admins_insert_webhook_subscriptions
  ON public.webhook_subscriptions
  FOR INSERT
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY admins_update_webhook_subscriptions
  ON public.webhook_subscriptions
  FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY admins_delete_webhook_subscriptions
  ON public.webhook_subscriptions
  FOR DELETE
  USING (public.current_user_is_admin());

-- --------------------------------------------
-- api_logs
-- --------------------------------------------
CREATE POLICY service_role_all_api_logs
  ON public.api_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY admins_read_api_logs
  ON public.api_logs
  FOR SELECT
  USING (public.current_user_is_admin());

-- --------------------------------------------
-- webhook_logs
-- --------------------------------------------
CREATE POLICY service_role_all_webhook_logs
  ON public.webhook_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY admins_read_webhook_logs
  ON public.webhook_logs
  FOR SELECT
  USING (public.current_user_is_admin());

-- --------------------------------------------
-- webhook_queue
-- --------------------------------------------
CREATE POLICY service_role_all_webhook_queue
  ON public.webhook_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY admins_read_webhook_queue
  ON public.webhook_queue
  FOR SELECT
  USING (public.current_user_is_admin());

-- --------------------------------------------
-- app_settings
-- --------------------------------------------
CREATE POLICY service_role_all_app_settings
  ON public.app_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY admins_all_app_settings
  ON public.app_settings
  FOR ALL
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY authenticated_read_non_sensitive_app_settings
  ON public.app_settings
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND key <> ALL (ARRAY['chatwoot_access_token'])
  );

-- --------------------------------------------
-- trigger_webhook: execute server-side with controlled permissions
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_webhook(
  p_event_type text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
BEGIN
  -- Authenticated users need create or admin permission
  IF auth.role() = 'authenticated' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.get_user_permissions(auth.uid()) p
      WHERE p.can_create = true OR p.is_admin = true
    ) THEN
      RAISE EXCEPTION 'Forbidden: missing permission to trigger webhooks'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  FOR v_subscription IN
    SELECT ws.id
    FROM public.webhook_subscriptions ws
    WHERE ws.is_active = true
      AND p_event_type = ANY(ws.events)
  LOOP
    INSERT INTO public.webhook_queue (subscription_id, event_type, payload)
    VALUES (v_subscription.id, p_event_type, p_payload);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_webhook(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_webhook(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_webhook(text, jsonb) TO service_role;

DO $$
BEGIN
  RAISE NOTICE 'Sprint 0 hardening applied:';
  RAISE NOTICE ' - Integration tables restricted to admins/service role';
  RAISE NOTICE ' - app_settings protects chatwoot_access_token from non-admin reads';
  RAISE NOTICE ' - trigger_webhook now runs as security definer with permission checks';
END $$;
