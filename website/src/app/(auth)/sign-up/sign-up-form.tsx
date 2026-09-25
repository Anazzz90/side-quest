"use client";

import { useActionState } from "react";
import { signUpWithPassword, type AuthFormState } from "../actions";

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpWithPassword,
    null
  );

  return (
    <form action={formAction} className="auth-form">
      <label htmlFor="displayName">Display name</label>
      <input id="displayName" name="displayName" type="text" maxLength={40} required />

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <label className="auth-checkbox">
        <input type="checkbox" name="ageConfirmed" required />
        I confirm I am 18 years of age or older.
      </label>

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
