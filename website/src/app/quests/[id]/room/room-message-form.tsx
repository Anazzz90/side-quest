"use client";

import { useActionState } from "react";
import { sendRoomMessage, type QuestFormState } from "../../actions";

export default function RoomMessageForm({ questId }: { questId: string }) {
  const action = sendRoomMessage.bind(null, questId);
  const [state, formAction, pending] = useActionState<QuestFormState, FormData>(action, null);

  return (
    <form action={formAction} className="room-message-form">
      <label className="sr-only" htmlFor="body">
        Message
      </label>
      <input id="body" name="body" type="text" maxLength={2000} placeholder="Send a message" required />
      <button className="button button-primary" type="submit" disabled={pending}>
        Send
      </button>
      {state?.error && <p className="auth-error">{state.error}</p>}
    </form>
  );
}
