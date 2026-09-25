export type PublicBackendConfig = {
  url: string;
  anonKey: string;
};

/** Returns only browser-safe public configuration. Never put a service-role key here. */
export function getPublicBackendConfig(): PublicBackendConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Development-only sign-up gate. Production registration stays disabled
 * until CP1 age-assurance, privacy, hosting-region, venue, account-integrity,
 * and moderation decisions are approved. Set AUTH_ALLOW_SIGNUP=true only in
 * local/dev environments; it is unset (falsy) by default everywhere else,
 * including any environment where NODE_ENV is "production".
 */
export function isSignupAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.AUTH_ALLOW_SIGNUP === "true";
}
