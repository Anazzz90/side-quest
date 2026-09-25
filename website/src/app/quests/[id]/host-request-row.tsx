"use client";

import { useState, useTransition } from "react";
import { decideRequest } from "../actions";

export default function HostRequestRow({
  requestId,
  questId,
  displayName,
  status,
  isFull,
}: {
  requestId: string;
  questId: string;
  displayName: string;
  status: string;
  isFull: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className="request-row">
      <span>{displayName}</span>
      <span className={`status-badge status-${status}`}>{status}</span>
      {status === "pending" && (
        <div className="request-row-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={pending || isFull}
            title={isFull ? "Quest is at capacity" : undefined}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await decideRequest(requestId, questId, "accepted");
                if (result?.error) setError(result.error);
              })
            }
          >
            Accept
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await decideRequest(requestId, questId, "declined");
                if (result?.error) setError(result.error);
              })
            }
          >
            Decline
          </button>
        </div>
      )}
      {error && <p className="auth-error">{error}</p>}
    </li>
  );
}
