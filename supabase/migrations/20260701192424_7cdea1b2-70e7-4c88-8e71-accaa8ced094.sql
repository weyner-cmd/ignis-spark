
-- 1) Switch helper functions to SECURITY INVOKER (removes elevated exec exposure)
ALTER FUNCTION public.get_my_role() SECURITY INVOKER;
ALTER FUNCTION public.get_my_tenant_id() SECURITY INVOKER;
ALTER FUNCTION public.get_available_slots(uuid, date, integer) SECURITY INVOKER;

-- 2) Lock down trigger-only SECURITY DEFINER functions from being called via API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger_fn() FROM PUBLIC, anon, authenticated;

-- 3) tenants: restrict SELECT to own tenant + super_admin
DROP POLICY IF EXISTS tenants_select_authenticated ON public.tenants;
CREATE POLICY tenants_select_own_or_super ON public.tenants
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin' OR id = public.get_my_tenant_id());

-- 4) sub_tenants: restrict SELECT to own tenant + super_admin
DROP POLICY IF EXISTS sub_tenants_select_authenticated ON public.sub_tenants;
CREATE POLICY sub_tenants_select_own_or_super ON public.sub_tenants
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin' OR tenant_id = public.get_my_tenant_id());

-- 5) profiles: prevent role/tenant_id self-escalation
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = public.get_my_role()
    AND tenant_id IS NOT DISTINCT FROM public.get_my_tenant_id()
  );

-- 6) storage: avatars insert only under user's own folder
DROP POLICY IF EXISTS "avatars_insert_authenticated" ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7) storage: remove broad SELECT policies (buckets remain public via direct URLs;
--    this only blocks enumeration of bucket contents through storage.objects)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view parish logos" ON storage.objects;

-- 8) storage: parish logo INSERT/UPDATE restricted to that parish's members (or super_admin)
--    Assumes path convention: <tenant_id>/<filename>
DROP POLICY IF EXISTS "Authenticated users can upload parish logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update parish logos" ON storage.objects;

CREATE POLICY parishes_insert_own_tenant ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'parishes'
    AND (
      public.get_my_role() = 'super_admin'
      OR (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    )
  );

CREATE POLICY parishes_update_own_tenant ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'parishes'
    AND (
      public.get_my_role() = 'super_admin'
      OR (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    )
  )
  WITH CHECK (
    bucket_id = 'parishes'
    AND (
      public.get_my_role() = 'super_admin'
      OR (storage.foldername(name))[1] = public.get_my_tenant_id()::text
    )
  );
