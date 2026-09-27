"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPassword, signInWithGoogle, type AuthFormState } from "../actions";

export default function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const created = searchParams.get("created") === "1";
  const oauthError = searchParams.get("error");

  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signInWithPassword,
    null
  );

  return (
    <>
      <form action={signInWithGoogle.bind(null, next)}>
        <button className="button button-secondary button-google" type="submit">
          Continue with Google
        </button>
      </form>
      {oauthError === "oauth" && <p className="auth-error">Google sign-in failed. Try again.</p>}
      {oauthError === "disabled" && (
        <p className="auth-error">Google sign-in is disabled in this environment.</p>
      )}

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form action={formAction} className="auth-form">
        <input type="hidden" name="next" value={next} />
        {created && <p className="auth-success">Account created. Sign in to continue.</p>}

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {state?.error && <p className="auth-error">{state.error}</p>}

        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
