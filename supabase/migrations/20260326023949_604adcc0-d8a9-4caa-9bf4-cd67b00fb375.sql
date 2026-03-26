
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_sub_tenant_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_sub_tenant_id_fkey FOREIGN KEY (sub_tenant_id) REFERENCES public.sub_tenants(id) ON DELETE SET NULL;
