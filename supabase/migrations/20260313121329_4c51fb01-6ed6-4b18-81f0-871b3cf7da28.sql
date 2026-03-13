
-- M2: Administratio tables (tithes and assets)
CREATE TABLE public.tithes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tithe_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'dizimo',
  payment_method TEXT DEFAULT 'dinheiro',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tithes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tithes_select_tenant" ON public.tithes
  FOR SELECT TO authenticated
  USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "tithes_all_admins" ON public.tithes
  FOR ALL TO authenticated
  USING ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')))
  WITH CHECK ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')));

CREATE TABLE public.parish_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'mobiliario',
  acquisition_date DATE,
  estimated_value NUMERIC(12,2) DEFAULT 0,
  condition TEXT DEFAULT 'bom',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.parish_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select_tenant" ON public.parish_assets
  FOR SELECT TO authenticated
  USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "assets_all_admins" ON public.parish_assets
  FOR ALL TO authenticated
  USING ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')))
  WITH CHECK ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')));

-- M3: Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- M3: Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- M3: Storage policies for avatars
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- M5: Pastoralis expanded tables
CREATE TABLE public.pastoral_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pastoral_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pastoral_groups_select_tenant" ON public.pastoral_groups
  FOR SELECT TO authenticated
  USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "pastoral_groups_all_admins" ON public.pastoral_groups
  FOR ALL TO authenticated
  USING ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')))
  WITH CHECK ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')));

CREATE TABLE public.pastoral_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.pastoral_groups(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  person_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'membro',
  mandate_start DATE,
  mandate_end DATE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pastoral_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pastoral_members_select_tenant" ON public.pastoral_members
  FOR SELECT TO authenticated
  USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "pastoral_members_all_admins" ON public.pastoral_members
  FOR ALL TO authenticated
  USING ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')))
  WITH CHECK ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')));

CREATE TABLE public.pastoral_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.pastoral_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pastoral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pastoral_events_select_tenant" ON public.pastoral_events
  FOR SELECT TO authenticated
  USING (get_my_tenant_id() = tenant_id);

CREATE POLICY "pastoral_events_all_admins" ON public.pastoral_events
  FOR ALL TO authenticated
  USING ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')))
  WITH CHECK ((get_my_role() = ANY (ARRAY['super_admin','matriz_admin'])) AND ((get_my_tenant_id() = tenant_id) OR (get_my_role() = 'super_admin')));
