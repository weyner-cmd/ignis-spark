
-- Fix: Drop and recreate get_available_slots using timestamp-based generate_series
CREATE OR REPLACE FUNCTION get_available_slots(
  p_tenant_id uuid, p_date date, p_interval_min int DEFAULT 30
) RETURNS TABLE(slot_time time) AS $$
  WITH slots AS (
    SELECT (p_date + '06:00'::time + (n * (p_interval_min || ' minutes')::interval))::time AS t
    FROM generate_series(0, ((14*60)/p_interval_min)) AS n
    WHERE (p_date + '06:00'::time + (n * (p_interval_min || ' minutes')::interval))::time <= '20:00'::time
  ),
  occupied AS (
    SELECT start_time::time AS s, end_time::time AS e
    FROM appointments
    WHERE tenant_id = p_tenant_id
      AND start_time::date = p_date
      AND status != 'cancelled'
  )
  SELECT s.t FROM slots s
  WHERE NOT EXISTS (
    SELECT 1 FROM occupied o WHERE s.t < o.e AND (s.t + (p_interval_min || ' minutes')::interval) > o.s
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
