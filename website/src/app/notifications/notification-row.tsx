"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationRead } from "../quests/actions";

export default function NotificationRow({
  id,
  read,
  label,
  questTitle,
  questId,
  createdAt,
}: {
  id: string;
  read: boolean;
  label: string;
  questTitle: string | null;
  questId: string | null;
  createdAt: string;
}) {
  const [pending, startTransition] = useTransition();

  const content = (
    <div className="notification-content">
      <span>{label}{questTitle ? `: ${questTitle}` : ""}</span>
      <span className="notification-time">
        {new Date(createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
      </span>
    </div>
  );

  return (
    <li
      className={`notification-row ${read ? "" : "notification-unread"}`}
      onClick={() => {
        if (!read) startTransition(() => markNotificationRead(id));
      }}
    >
      {questId ? <Link href={`/quests/${questId}`}>{content}</Link> : content}
      {!read && <span className="notification-dot" aria-label="Unread" />}
      {pending && <span className="quest-meta">Marking read…</span>}
    </li>
  );
}
