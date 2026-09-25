"use client";

import { useState, useTransition } from "react";
import { cancelQuest } from "../actions";

export default function CancelQuestButton({ questId }: { questId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button className="button button-secondary" type="button" onClick={() => setConfirming(true)}>
        Cancel quest
      </button>
    );
  }

  return (
    <div className="quest-action">
      <p className="auth-note">Cancelling notifies no one automatically yet and cannot be undone.</p>
      <button
        className="button button-primary"
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => cancelQuest(questId))}
      >
        {pending ? "Cancelling…" : "Confirm cancel"}
      </button>
      <button className="button button-secondary" type="button" onClick={() => setConfirming(false)}>
        Keep it
      </button>
    </div>
  );
}
