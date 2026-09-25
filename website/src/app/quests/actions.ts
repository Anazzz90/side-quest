"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type QuestFormState = { error: string } | null;

const FAVOR_GUIDANCE =
  "Favors must stay small, safe, and non-commercial: no money changes hands, no regulated services, no medical, legal, or transport tasks, and nothing that requires entering a private residence.";

export async function createQuest(
  _prev: QuestFormState,
  formData: FormData
): Promise<QuestFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?next=/quests/new");
  }

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

  if (!categoryId || !areaId || !meetupPlaceId || !title || !description || !scheduledStart || !scheduledEnd) {
    return { error: "Fill in every required field." };
  }
  if (questType !== "activity" && questType !== "favor") {
    return { error: "Choose a quest type." };
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
    return { error: "Capacity must be between 1 and 20." };
  }
  if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
    return { error: "End time must be after the start time." };
  }
  if (questType === "favor" && !favorAck) {
    return { error: `You must acknowledge the favor guidance: ${FAVOR_GUIDANCE}` };
  }
  if (!meetingInstructions) {
    return { error: "Add private meeting instructions for accepted participants." };
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
      description,
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
    return { error: error?.message ?? "Could not create the quest." };
  }

  const { error: instructionsError } = await supabase.rpc("set_private_instructions", {
    p_quest_id: quest.id,
    p_instructions: meetingInstructions,
  });
  if (instructionsError) {
    return { error: instructionsError.message };
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
  if (error) return { error: error.message };
  revalidatePath(`/quests/${questId}`);
  return null;
}

export async function withdrawRequest(requestId: string, questId: string): Promise<QuestFormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_join_request", { p_request_id: requestId });
  if (error) return { error: error.message };
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
  if (error) return { error: error.message };
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
