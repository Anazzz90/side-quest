import { Suspense } from "react";
import Link from "next/link";
import SignInForm from "./sign-in-form";

export const metadata = { title: "Sign in · Side Quest" };

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">DEVELOPMENT SIGN-IN</p>
        <h1>Sign in to Side Quest</h1>
        <p className="auth-note">
          This is a development-only identity flow for local review. No production
          accounts or real user data are enabled yet.
        </p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <p className="auth-switch">
          New here? <Link href="/sign-up">Create a development account</Link>
        </p>
      </div>
    </main>
  );
}
