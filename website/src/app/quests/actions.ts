"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuestFormState = { error: string } | null;

export type CreateQuestState = {
  error: string;
  // Echoes back what the user typed so the form can restore it after a
  // failed submission -- losing everything on a validation error is exactly
  // the kind of thing that makes people give up on a form.
  values: Record<string, string>;
} | null;

const FAVOR_GUIDANCE =
  "Favors must stay small, safe, and non-commercial: no money changes hands, no regulated services, no medical, legal, or transport tasks, and nothing that requires entering a private residence.";

// Every message a database trigger or function in supabase/migrations/ can
// raise, translated into something a user should actually read. Anything
// not in this list falls back to a generic message rather than ever
// showing raw Postgres/PostgREST text.
const FRIENDLY_DB_ERRORS: Record<string, string> = {
  "category is not enabled for this quest type": "That category isn't available for this quest type. Pick a different one.",
  "area is not active": "This area isn't open for quests right now.",
  "meetup place is not an active place in this area": "That meetup place isn't available. Pick a different one.",
  "favor quests require prohibited-favor guidance acknowledgement": "Please confirm the favor guidance checkbox.",
  "quest is full": "This quest is already full.",
  "you already have an active request for this quest": "You already have a request for this quest.",
  "hosts cannot request to join their own quest": "You can't request to join your own quest.",
  "quest is not open for requests": "This quest isn't open for requests anymore.",
  "quest has expired": "This quest has expired.",
  "unable to request to join this quest": "You can't request to join this quest.",
  "only the host can decide join requests": "Only the host can accept or decline requests.",
  "request is not pending": "That request has already been decided.",
  "not your request": "That isn't your request.",
  "this request cannot be withdrawn": "That request can no longer be withdrawn.",
  "a cancelled quest cannot be reopened": "A cancelled quest can't be reopened.",
  "a published quest cannot return to draft": "This quest can't be unpublished.",
  "capacity cannot drop below the number of accepted participants": "Capacity can't be lower than the number of people already accepted.",
  "only the host can set private meeting instructions": "Only the host can set meeting instructions.",
};

function friendlyError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  return FRIENDLY_DB_ERRORS[message] ?? "Something went wrong. Please check your details and try again.";
}

function valuesFromForm(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export async function createQuest(
  _prev: CreateQuestState,
  formData: FormData
): Promise<CreateQuestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?next=/quests/new");
  }

  const values = valuesFromForm(formData);
  const fail = (error: string) => ({ error, values });

  const questType = String(formData.get("questType") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const areaId = String(formData.get("areaId") ?? "");
  const meetupPlaceId = String(formData.get("meetupPlaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const scheduledStart = String(formData.get("scheduledStart") ?? "");
  const scheduledEnd = String(formData.get("scheduledEnd") ?? "");
  const capacity = Number(formData.get("capacity") ?? 0);
  const costNote = String(formData.get("costNote") ?? "").trim();
  const accessibilityNotes = String(formData.get("accessibilityNotes") ?? "").trim();
  const proofRule = String(formData.get("proofRule") ?? "host_confirmation");
  const meetingInstructions = String(formData.get("meetingInstructions") ?? "").trim();
  const favorAck = formData.get("favorAck") === "on";

  if (!categoryId || !areaId || !meetupPlaceId || !title || !scheduledStart || !scheduledEnd) {
    return fail("Fill in every required field.");
  }
  if (questType !== "activity" && questType !== "favor") {
    return fail("Choose a quest type.");
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
    return fail("Capacity must be between 1 and 20.");
  }
  if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
    return fail("End time must be after the start time.");
  }
  if (questType === "favor" && !favorAck) {
    return fail(`You must acknowledge the favor guidance: ${FAVOR_GUIDANCE}`);
  }
  if (!meetingInstructions) {
    return fail("Add private meeting instructions for accepted participants.");
  }

  const expiresAt = scheduledStart; // requests close once the quest starts

  const { data: quest, error } = await supabase
    .from("quests")
    .insert({
      host_user_id: user.id,
      area_id: areaId,
      category_id: categoryId,
      quest_type: questType,
      meetup_place_id: meetupPlaceId,
      title,
      description: description || null,
      scheduled_start: new Date(scheduledStart).toISOString(),
      scheduled_end: new Date(scheduledEnd).toISOString(),
      capacity,
      cost_note: costNote || null,
      accessibility_notes: accessibilityNotes || null,
      proof_rule: proofRule as "host_confirmation" | "photo_evidence" | "none",
      expires_at: new Date(expiresAt).toISOString(),
      favor_ack: favorAck,
      status: "published",
    })
    .select("id")
    .single();

  if (error || !quest) {
    return fail(friendlyError(error?.message));
  }

  const { error: instructionsError } = await supabase.rpc("set_private_instructions", {
    p_quest_id: quest.id,
    p_instructions: meetingInstructions,
  });
  if (instructionsError) {
    return fail(friendlyError(instructionsError.message));
  }

  revalidatePath("/");
  redirect(`/quests/${quest.id}`);
}

export async function cancelQuest(questId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quests").update({ status: "cancelled" }).eq("id", questId);
  if (error) throw error;
  revalidatePath(`/quests/${questId}`);
  revalidatePath("/");
}

export async function requestToJoin(questId: string): Promise<QuestFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_to_join", { p_quest_id: questId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/quests/${questId}`);
  return null;
}

export async function withdrawRequest(requestId: string, questId: string): Promise<QuestFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_join_request", { p_request_id: requestId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/quests/${questId}`);
  return null;
}

export async function decideRequest(
  requestId: string,
  questId: string,
  decision: "accepted" | "declined"
): Promise<QuestFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_join_request", {
    p_request_id: requestId,
    p_decision: decision,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/quests/${questId}`);
  return null;
}

export async function sendRoomMessage(
  questId: string,
  _prev: QuestFormState,
  formData: FormData
): Promise<QuestFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };

  const { error } = await supabase
    .from("quest_room_messages")
    .insert({ quest_id: questId, sender_user_id: user.id, body });
  if (error) return { error: "Could not send that message." };

  revalidatePath(`/quests/${questId}/room`);
  return null;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  revalidatePath("/notifications");
}
