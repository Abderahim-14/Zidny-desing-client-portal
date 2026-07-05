import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely. Reserved for modules that are
// themselves the trust boundary -- today, only lib/portal/PortalClient.ts.
// Never import this into a client component or a route that forwards an
// end user's request without its own authorization check: PortalClient
// stands in for what will eventually be portal-to-portal API calls, so
// access control for *who* may call it belongs at the call site, not here.
let cachedClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
}
