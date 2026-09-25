import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAcceptedCount,
  getMyRequestForQuest,
  getQuestDetail,
  listHostRequests,
} from "@/lib/data/quests";
import RequestJoinButton from "./request-join-button";
import HostRequestRow from "./host-request-row";
import CancelQuestButton from "./cancel-quest-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { activity: "Activity", favor: "Favor" };

function formatWhen(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const startTime = s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endTime = e.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${startTime} – ${endTime}`;
}

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quest = await getQuestDetail(id);
  if (!quest) notFound();

  const isHost = user?.id === quest.host_user_id;
  const acceptedCount = await getAcceptedCount(id);
  const isFull = acceptedCount >= quest.capacity;
  const isExpired = new Date(quest.expires_at) <= new Date();

  const myRequest = user && !isHost ? await getMyRequestForQuest(id, user.id) : null;
  const hostRequests = isHost ? await listHostRequests(id) : null;

  const isMember = isHost || myRequest?.status === "accepted";

  let effectiveStatus: string = quest.status;
  if (quest.status === "published" && isExpired) effectiveStatus = "expired";

  return (
    <main className="page-shell">
      <div className="page-card">
        <div className="quest-detail-header">
          <div>
            <p className="eyebrow">{TYPE_LABEL[quest.quest_type]} · {quest.category?.label}</p>
            <h1>{quest.title}</h1>
          </div>
          <span className={`status-badge status-${effectiveStatus}`}>{effectiveStatus}</span>
        </div>

        <p className="quest-meta">{formatWhen(quest.scheduled_start, quest.scheduled_end)}</p>
        <p className="quest-meta">{quest.meetup_place?.label}</p>
        <p className="quest-meta">
          {acceptedCount} / {quest.capacity} joined
        </p>

        <p className="quest-description">{quest.description}</p>

        {quest.cost_note && <p className="quest-meta">Cost: {quest.cost_note}</p>}
        {quest.accessibility_notes && <p className="quest-meta">Accessibility: {quest.accessibility_notes}</p>}
        <p className="quest-meta">Proof required: {quest.proof_rule.replace("_", " ")}</p>

        {isMember && (
          <p className="auth-success">
            <Link href={`/quests/${id}/room`}>Open the quest room</Link> for private meeting
            instructions and chat.
          </p>
        )}

        {!user && (
          <p className="auth-note">
            <Link href={`/sign-in?next=/quests/${id}`}>Sign in</Link> to request to join.
          </p>
        )}

        {user && !isHost && (
          <RequestJoinButton
            questId={id}
            myRequestStatus={myRequest?.status ?? null}
            myRequestId={myRequest?.id ?? null}
            disabled={effectiveStatus !== "published" || (isFull && !myRequest)}
            isFull={isFull}
          />
        )}

        {isHost && (
          <div className="host-panel">
            <h2>Manage this quest</h2>
            {effectiveStatus === "published" && <CancelQuestButton questId={id} />}
            <h3>Join requests</h3>
            {!hostRequests || hostRequests.length === 0 ? (
              <p className="quest-meta">No requests yet.</p>
            ) : (
              <ul className="request-list">
                {hostRequests.map((r) => (
                  <HostRequestRow
                    key={r.id}
                    requestId={r.id}
                    questId={id}
                    displayName={r.requester?.display_name ?? "Account holder"}
                    status={r.status}
                    isFull={isFull}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
