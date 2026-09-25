import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrivateInstructions, getQuestDetail, listRoomMessages } from "@/lib/data/quests";
import RoomMessageForm from "./room-message-form";

export const dynamic = "force-dynamic";

export default async function QuestRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/quests/${id}/room`);

  const quest = await getQuestDetail(id);
  if (!quest) notFound();

  // Row-level security is the real gate: if this user isn't the host or an
  // accepted participant, both queries below come back empty rather than
  // throwing, because is_quest_member() denies the underlying rows. This
  // check exists only to show a clear message instead of a bare empty page.
  const [instructions, messages] = await Promise.all([
    getPrivateInstructions(id),
    listRoomMessages(id),
  ]);

  const isHost = user.id === quest.host_user_id;
  if (!instructions && !isHost) {
    return (
      <main className="page-shell">
        <div className="page-card">
          <p className="auth-error">
            This room is only available to the host and accepted participants.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-card">
        <p className="eyebrow">QUEST ROOM</p>
        <h1>{quest.title}</h1>

        {instructions && (
          <div className="instructions-box">
            <h2>Private meeting instructions</h2>
            <p>{instructions.instructions}</p>
          </div>
        )}

        <h2>Chat</h2>
        <ul className="message-list">
          {messages.length === 0 && <li className="quest-meta">No messages yet.</li>}
          {messages.map((m) => (
            <li key={m.id} className={m.sender_user_id === user.id ? "message-own" : "message-other"}>
              <span className="message-sender">{m.sender?.display_name ?? "Account holder"}</span>
              <span className="message-body">{m.body}</span>
              <span className="message-time">
                {new Date(m.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>

        <RoomMessageForm questId={id} />
      </div>
    </main>
  );
}
