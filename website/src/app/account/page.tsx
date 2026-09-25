import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

export const metadata = { title: "Account · Side Quest" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/account");
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("display_name, account_status, leaderboard_opt_in, created_at")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">ACCOUNT STANDING</p>
        <h1>Your account</h1>
        <dl className="account-summary">
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Display name</dt>
          <dd>{profile?.display_name ?? "—"}</dd>
          <dt>Status</dt>
          <dd>{profile?.account_status ?? (error ? "unavailable" : "—")}</dd>
          <dt>Leaderboard opt-in</dt>
          <dd>{profile?.leaderboard_opt_in ? "Yes" : "No"}</dd>
        </dl>
        {error && (
          <p className="auth-error">
            Could not load profile details ({error.message}).
          </p>
        )}
        <form action={signOut}>
          <button className="button button-secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
