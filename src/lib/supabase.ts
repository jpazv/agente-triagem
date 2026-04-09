import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público — usado no frontend (respects RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service role — usado nas API routes para bypass de RLS
// Só instancie server-side (nunca exponha a service role key no browser)
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}
