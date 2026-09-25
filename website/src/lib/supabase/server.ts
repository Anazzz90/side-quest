import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicBackendConfig } from "@/lib/backend-config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server-side Supabase client bound to the request's cookies. Uses only the
 * public anon key and relies on row-level security for authorization; the
 * service-role key never appears here or anywhere reachable from a request.
 */
export async function createClient() {
  const config = getPublicBackendConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local after starting the local stack."
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render; the middleware below
          // refreshes the session cookie on the next request instead.
        }
      },
    },
  });
}
