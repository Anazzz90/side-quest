import Link from "next/link";
import { isSignupAllowed } from "@/lib/backend-config";
import SignUpForm from "./sign-up-form";

export const metadata = { title: "Create account · Side Quest" };

export default function SignUpPage() {
  const allowed = isSignupAllowed();

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">DEVELOPMENT SIGN-UP</p>
        <h1>Create a development account</h1>
        <p className="auth-note">
          Synthetic accounts only. Production registration stays disabled until the
          CP1 age-assurance, privacy, hosting-region, venue, account-integrity, and
          moderation decisions are approved.
        </p>
        {allowed ? (
          <SignUpForm />
        ) : (
          <p className="auth-error">
            Sign-up is disabled in this environment. Set AUTH_ALLOW_SIGNUP=true in a
            local .env.local to enable it for development.
          </p>
        )}
        <p className="auth-switch">
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
