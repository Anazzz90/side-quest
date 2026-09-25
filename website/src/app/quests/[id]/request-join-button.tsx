"use client";

import { useState, useTransition } from "react";
import { requestToJoin, withdrawRequest } from "../actions";

const LABELS: Record<string, string> = {
  pending: "Request pending",
  accepted: "Request accepted",
  declined: "Request declined",
  withdrawn: "Request withdrawn",
};

export default function RequestJoinButton({
  questId,
  myRequestStatus,
  myRequestId,
  disabled,
  isFull,
}: {
  questId: string;
  myRequestStatus: string | null;
  myRequestId: string | null;
  disabled: boolean;
  isFull: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (myRequestStatus === "pending" || myRequestStatus === "accepted") {
    return (
      <div className="quest-action">
        <span className={`status-badge status-${myRequestStatus}`}>{LABELS[myRequestStatus]}</span>
        <button
          className="button button-secondary"
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = myRequestId ? await withdrawRequest(myRequestId, questId) : null;
              if (result?.error) setError(result.error);
            })
          }
        >
          {myRequestStatus === "accepted" ? "Leave" : "Withdraw request"}
        </button>
        {error && <p className="auth-error">{error}</p>}
      </div>
    );
  }

  if (myRequestStatus === "declined" || myRequestStatus === "withdrawn") {
    return (
      <div className="quest-action">
        <span className={`status-badge status-${myRequestStatus}`}>{LABELS[myRequestStatus]}</span>
        {!disabled && (
          <button
            className="button button-primary"
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await requestToJoin(questId);
                if (result?.error) setError(result.error);
              })
            }
          >
            Request again
          </button>
        )}
        {error && <p className="auth-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="quest-action">
      <button
        className="button button-primary"
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await requestToJoin(questId);
            if (result?.error) setError(result.error);
          })
        }
      >
        {isFull ? "Quest is full" : pending ? "Requesting…" : "Request to join"}
      </button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}
