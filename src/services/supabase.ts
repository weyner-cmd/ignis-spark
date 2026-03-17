import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const FALLBACK_PROJECT_ID = 'xcfsqlttkfdvezzmirmh';
const FALLBACK_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZnNxbHR0a2ZkdmV6em1pcm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDc0ODcsImV4cCI6MjA4ODY4MzQ4N30.z_WOUMgmcZUpwMGNlekGF-Ko9FjgMQwbjeiRMXisn2s';

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (projectId ? `https://${projectId}.supabase.co` : FALLBACK_URL);
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || FALLBACK_PUBLISHABLE_KEY;

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('[backend] VITE_SUPABASE_URL ausente no build; usando fallback automático.');
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
