// Re-export the single Supabase client instance to avoid multiple GoTrueClient warnings.
// All app code should import from this file: import { supabase } from '@/services/supabase';
export { supabase } from '@/integrations/supabase/client';
