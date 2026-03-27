CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_tenant_id uuid;
BEGIN
  SELECT id INTO default_tenant_id 
  FROM public.tenants 
  WHERE status = 'active' 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  INSERT INTO public.profiles (id, full_name, role, tenant_id, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'fiel',
    default_tenant_id,
    'active'
  );
  RETURN new;
END;
$$;