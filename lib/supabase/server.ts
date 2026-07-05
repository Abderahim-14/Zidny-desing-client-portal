import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-bound client (anon key, RLS applies). Use this for reading data
// in Server Components/Actions on behalf of the signed-in user -- it's the
// counterpart to lib/supabase/admin.ts, which deliberately bypasses RLS
// and is reserved for PortalClient/workflow actions.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render -- middleware.ts is
            // responsible for refreshing the session cookie in that case.
          }
        },
      },
    }
  );
}
