import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/data/quests";
import NotificationRow from "./notification-row";

export const metadata = { title: "Notifications · Side Quest" };
export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  join_request_created: "New request to join your quest",
  join_request_accepted: "Your request was accepted",
  join_request_declined: "Your request was declined",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/notifications");

  const notifications = await listNotifications(user.id);

  return (
    <main className="page-shell">
      <div className="page-card">
        <p className="eyebrow">NOTIFICATIONS</p>
        <h1>Quest and request updates</h1>
        {notifications.length === 0 ? (
          <p className="quest-meta">Nothing yet.</p>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                id={n.id}
                read={Boolean(n.read_at)}
                label={LABELS[n.type] ?? n.type}
                questTitle={typeof n.data === "object" && n.data && "quest_title" in n.data ? String(n.data.quest_title) : null}
                questId={n.quest_id}
                createdAt={n.created_at}
              />
            ))}
          </ul>
        )}
        {notifications.some((n) => n.quest_id) && (
          <p className="quest-meta">
            Tap a notification to open the quest, or visit <Link href="/">Explore</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
