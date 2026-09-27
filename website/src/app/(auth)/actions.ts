"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSignupAllowed } from "@/lib/backend-config";
import { checkRateLimit } from "@/lib/rate-limit";

export type AuthFormState = { error: string } | null;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const ip = await clientIp();
  const { allowed } = checkRateLimit(`signin:${ip}:${email}`, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Surface the real reason where we can -- "check your password" is
    // actively misleading when the account exists but isn't confirmed yet.
    if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
      return { error: "Confirm your email before signing in. Check your inbox for the confirmation link." };
    }
    return { error: "Sign-in failed. Check your email and password." };
  }

  redirect(next.startsWith("/") ? next : "/account");
}

export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSignupAllowed()) {
    return { error: "Sign-up is disabled in this environment." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const ageConfirmed = formData.get("ageConfirmed") === "on";

  if (!email || !password || !displayName) {
    return { error: "Fill in your name, email, and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!ageConfirmed) {
    return { error: "You must confirm you are 18 or older to continue." };
  }

  const ip = await clientIp();
  const { allowed } = checkRateLimit(`signup:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { error: "Could not create the account. Try a different email." };
  }

  redirect("/sign-in?created=1");
}

export async function signInWithGoogle(next: string) {
  if (!isSignupAllowed()) {
    // Google sign-in is also a registration path (Supabase creates the
    // account on first login), so it's gated the same as email/password
    // sign-up: development-only until CP1 approves production access.
    redirect("/sign-in?error=disabled");
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${h.get("host")}`;
  const safeNext = next.startsWith("/") ? next : "/account";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });

  if (error || !data.url) {
    redirect("/sign-in?error=oauth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
