"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPassword, type AuthFormState } from "../actions";

export default function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const created = searchParams.get("created") === "1";

  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signInWithPassword,
    null
  );

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={next} />
      {created && (
        <p className="auth-success">Account created. Sign in to continue.</p>
      )}
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
  );
}
